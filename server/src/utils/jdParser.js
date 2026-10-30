const path = require('path');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const httpError = require('./httpError');

const MAX_CHARS = 15000;

// PDF / DOCX / TXT buffer -> plain text
exports.extractText = async (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  let text = '';
  if (ext === '.pdf') text = (await pdfParse(file.buffer)).text;
  else if (ext === '.docx') text = (await mammoth.extractRawText({ buffer: file.buffer })).value;
  else if (ext === '.txt') text = file.buffer.toString('utf8');
  else throw httpError(400, 'Upload a PDF, DOCX or TXT file');

  text = text.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
  if (text.length < 30) throw httpError(422, 'Could not read any text from this file (scanned PDF?)');
  return text.slice(0, MAX_CHARS);
};

// ---------- rule-based field extraction (no API, no cost) ----------
const BULLET = /^\s*(?:[•●▪■◦·\-–—*✓✔►>]|\d{1,2}[.)])\s*/;
const ROLE_WORDS = /(engineer|developer|designer|manager|analyst|lead|director|architect|consultant|specialist|executive|intern|officer|scientist|associate|recruiter|marketer|writer|administrator|coordinator|tester|qa|devops|sde|head of|vp|product|researcher|accountant|representative)/i;

const SECTION_HEADS = {
  requirements: /^(requirements?|qualifications?|what you['’]?ll bring|what we['’]?re looking for|who you are|you have|must[- ]have|(key |required |desired )?skills( required)?|required (skills|qualifications)|minimum qualifications|what you need|candidate profile|eligibility|experience( required)?)$/i,
  description: /^(about the (role|job|position|opportunity)|job description|role (overview|summary|description)|overview|the role|what you['’]?ll do|(key )?responsibilities|your role|(job|position) summary|summary)$/i,
  specific: /^(additional (requirements|information)|other requirements|special requirements|notes?|important|company[- ]specific.*|portfolio( requirements)?|good to know)$/i,
  other: /^(benefits|perks|what we offer|why join.*|about (us|the company|[a-z0-9&.\- ]{2,30})|how to apply|apply( now)?|compensation|salary|equal opportunity.*|nice to have|preferred( qualifications| skills)?|bonus|good to have)$/i,
};

const headingOf = (line) => {
  const t = line.replace(BULLET, '').replace(/[:：\s]+$/, '').trim();
  // "Contact: x" / "Location: y" style lines end the previous section
  if (/^(contact|e-?mail|phone|apply|how to apply|salary|compensation|location|work (mode|type)|employment type|job type)\s*[:\-–]/i.test(t)) return 'other';
  if (!t || t.length > 60 || /[.!?]$/.test(t)) return null;
  for (const [key, rx] of Object.entries(SECTION_HEADS)) if (rx.test(t)) return key;
  return /[:：]\s*$/.test(line) && t.split(' ').length <= 6 ? 'other' : null; // unknown "Something:" heading ends a section
};

const label = (lines, names) => {
  const rx = new RegExp(`^(?:${names})\\s*[:\\-–]\\s*(?<v>.+)$`, 'i');
  for (const l of lines.slice(0, 80)) {
    const m = l.replace(BULLET, '').match(rx);
    if (m && m.groups.v.trim().length <= 120) return m.groups.v.trim();
  }
  return '';
};

// split into { requirements: [...], description: [...], specific: [...] }
const sectionsOf = (lines) => {
  const out = { requirements: [], description: [], specific: [] };
  let cur = null;
  lines.forEach((line) => {
    const h = headingOf(line);
    if (h) { cur = out[h] ? h : null; return; }
    if (!cur) return;
    const bullet = BULLET.test(line);
    const items = out[cur];
    const prev = items[items.length - 1];
    // re-join lines that a PDF wrapped mid-sentence
    if (!bullet && prev && !/[.:;]$/.test(prev) && /^[a-z(]/.test(line)) items[items.length - 1] = `${prev} ${line}`;
    else items.push(line.replace(BULLET, '').trim());
  });
  return out;
};

const pickTitle = (lines) => {
  const labeled = label(lines, 'job title|position|role|title|opening|vacancy');
  if (labeled) return labeled;
  const hiring = lines.slice(0, 15).join('\n').match(/\b(?:hiring|looking for|seeking)\s+(?:an?\s+)?([A-Z][\w/&+.\- ]{3,60}?)(?:[.,\n]| to | who | with | for )/);
  if (hiring && ROLE_WORDS.test(hiring[1])) return hiring[1].trim();
  const candidate = lines.slice(0, 8).find(
    (l) => l.length <= 80 && !/[.!?]$/.test(l) && ROLE_WORDS.test(l) && !/^(about|job description|we |our )/i.test(l)
  );
  return (candidate || '').replace(/^(job description|job title|position)\s*[:\-–]\s*/i, '').trim();
};

const pickCompany = (lines, text, title) => {
  const labeled = label(lines, 'company( name)?|organi[sz]ation|employer|client');
  if (labeled) return labeled;
  const atTitle = lines.slice(0, 8).map((l) => l.match(/\s(?:at|@|[-–|])\s+([A-Z][\w&.\- ]{1,40})$/)).find(Boolean);
  if (atTitle && !ROLE_WORDS.test(atTitle[1])) return atTitle[1].trim();
  const about = lines.map((l) => l.match(/^about\s+([A-Z][\w&.\-]*(?: [A-Z][\w&.\-]*){0,3})\s*:?$/)).find((m) => m && !/^(Us|The|You|Role|Job|Team)\b/.test(m[1]));
  if (about) return about[1].trim();
  const is = text.match(/(?:^|\n)([A-Z][\w&.\-]*(?: [A-Z][\w&.\-]*){0,3}) (?:is|are) (?:hiring|looking|seeking|searching|growing)/);
  return is ? is[1].trim() : '';
};

const pickWorkMode = (lines, text) => {
  const l = label(lines, 'work (mode|type|model|arrangement)|mode of work|work location type').toLowerCase() || '';
  const src = l || text;
  if (/\bhybrid\b/i.test(src)) return 'Hybrid';
  const remote = (src.match(/\bremote(?:ly)?\b|work from home|\bwfh\b/gi) || []).length;
  const onsite = (src.match(/on[- ]?site|in[- ]office|work from office|\bwfo\b/gi) || []).length;
  if (!remote && !onsite) return '';
  return remote >= onsite ? 'Remote' : 'On-site';
};

const pickType = (lines, text) => {
  const l = label(lines, 'employment type|job type|type of (employment|job)|contract type');
  const src = l || text;
  if (!l && /intern(ship)?/i.test(lines.slice(0, 5).join(' '))) return 'Internship';
  if (/\binternship\b/i.test(l)) return 'Internship';
  if (/\bfull[- ]?time\b|\bpermanent\b/i.test(src)) return 'Full-time';
  if (/\bpart[- ]?time\b/i.test(src)) return 'Part-time';
  if (/\bcontract(or)?\b|freelance|fixed[- ]term/i.test(src)) return 'Contract';
  return '';
};

const pickLocation = (lines, workMode) => {
  const l = label(lines, 'job location|work location|location|based in|city|office');
  if (l) return l;
  return workMode === 'Remote' ? 'Remote' : '';
};

const pickEmail = (text) => {
  const all = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
  return (all.find((e) => !/no-?reply|donotreply/i.test(e)) || '').toLowerCase();
};

const pickLink = (text) => {
  const urls = (text.match(/https?:\/\/[^\s<>()"']+/gi) || []).map((u) => u.replace(/[.,;:!?]+$/, ''));
  return urls.find((u) => /apply|career|jobs?|lever\.co|greenhouse|workable|ashby|smartrecruiters|linkedin\.com\/jobs/i.test(u)) || '';
};

const summarize = (items, max) => {
  const text = items.filter((i) => i.length > 3).map((i) => (/[.!?;:]$/.test(i) ? i : `${i}.`)).join(' ').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
  return (end > max * 0.5 ? cut.slice(0, end + 1) : `${cut.trimEnd()}…`);
};

// text -> form fields. Blank string / [] means "not found"; the UI only fills what was found.
exports.extractFields = (text) => {
  const lines = text.split('\n').map((l) => l.replace(/\u00a0/g, ' ').trim()).filter(Boolean);
  const sec = sectionsOf(lines);

  let requirements = sec.requirements.filter((r) => r.length > 2).map((r) => r.slice(0, 140));
  if (!requirements.length) {
    requirements = lines
      .filter((l) => BULLET.test(l) && /(\d\+?\s*years?|experience|proficien|knowledge of|familiar|skills?)/i.test(l))
      .map((l) => l.replace(BULLET, '').slice(0, 140));
  }

  let description = summarize(sec.description, 500);
  if (!description) {
    const para = lines.find((l) => l.length > 80 && !BULLET.test(l));
    description = para ? summarize([para], 500) : '';
  }

  const workMode = pickWorkMode(lines, text);
  const title = pickTitle(lines);

  return {
    title,
    company: pickCompany(lines, text, title),
    location: pickLocation(lines, workMode),
    workMode,
    employmentType: pickType(lines, text),
    description,
    requirements: requirements.slice(0, 12),
    companySpecificRequirements: summarize(sec.specific, 400),
    applicationLink: pickLink(text),
    contactEmail: pickEmail(text),
  };
};
