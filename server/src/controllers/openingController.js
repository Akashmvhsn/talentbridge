const Opening = require('../models/Opening');
const Placement = require('../models/Placement');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { extractText, extractFields } = require('../utils/jdParser');

const WORK_MODES = ['Remote', 'Hybrid', 'On-site'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const SORTS = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, trusted: { placementCount: -1, createdAt: -1 } };
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Accept "a, b, c" or ["a","b"]
const toList = (v) =>
  (Array.isArray(v) ? v : String(v || '').split(','))
    .map((s) => String(s).trim())
    .filter(Boolean);

const pickFields = (b) => {
  const data = {
    title: b.title,
    company: b.company,
    location: b.location,
    workMode: b.workMode,
    employmentType: b.employmentType,
    description: b.description,
    requirements: b.requirements !== undefined ? toList(b.requirements) : undefined,
    companySpecificRequirements: b.companySpecificRequirements,
    applicationLink: b.applicationLink,
    contactEmail: b.contactEmail,
    contactPhone: b.contactPhone,
  };
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

  if (data.applicationLink && !/^https?:\/\//i.test(data.applicationLink)) {
    throw httpError(400, 'Application link must start with http:// or https://');
  }
  if (data.contactEmail && !/^\S+@\S+\.\S+$/.test(data.contactEmail)) {
    throw httpError(400, 'Enter a valid contact email');
  }
  return data;
};

const POSTER_FIELDS = 'name role company';

// GET /api/openings?q=&workMode=&employmentType=&sort=newest|oldest|trusted
exports.list = asyncHandler(async (req, res) => {
  const { q, workMode, employmentType, sort } = req.query;
  const filter = { isActive: true };

  if (workMode && WORK_MODES.includes(workMode)) filter.workMode = workMode;
  if (employmentType && EMPLOYMENT_TYPES.includes(employmentType)) filter.employmentType = employmentType;
  if (q && q.trim()) {
    const rx = new RegExp(escapeRegex(q.trim()), 'i');
    filter.$or = [{ title: rx }, { company: rx }, { location: rx }, { requirements: rx }];
  }

  const openings = await Opening.find(filter).sort(SORTS[sort] || SORTS.newest).limit(100).populate('postedBy', POSTER_FIELDS);
  res.json({ count: openings.length, openings });
});

// GET /api/openings/mine
exports.mine = asyncHandler(async (req, res) => {
  const openings = await Opening.find({ postedBy: req.user._id }).sort({ createdAt: -1 }).populate('postedBy', POSTER_FIELDS);
  res.json({ count: openings.length, openings });
});

// GET /api/openings/:id
exports.getOne = asyncHandler(async (req, res) => {
  const opening = await Opening.findById(req.params.id).populate('postedBy', POSTER_FIELDS);
  if (!opening) throw httpError(404, 'Opening not found');

  const isOwner = opening.postedBy._id.equals(req.user._id);
  const hasPlaced = !!(await Placement.exists({ opening: opening._id, user: req.user._id }));

  // owner also gets their own phone back so the edit form can show it
  const json = opening.toJSON();
  if (isOwner) json.contactPhone = opening.contactPhone;

  res.json({ opening: { ...json, isOwner, hasPlaced } });
});

// POST /api/openings
exports.create = asyncHandler(async (req, res) => {
  const opening = await Opening.create({ ...pickFields(req.body), postedBy: req.user._id });
  res.status(201).json({ opening });
});

// PUT /api/openings/:id  (owner only)
exports.update = asyncHandler(async (req, res) => {
  const opening = await Opening.findById(req.params.id);
  if (!opening) throw httpError(404, 'Opening not found');
  if (!opening.postedBy.equals(req.user._id)) throw httpError(403, 'You can only edit your own openings');

  Object.assign(opening, pickFields(req.body));
  await opening.save();
  res.json({ opening });
});

// DELETE /api/openings/:id  (owner only)
exports.remove = asyncHandler(async (req, res) => {
  const opening = await Opening.findById(req.params.id);
  if (!opening) throw httpError(404, 'Opening not found');
  if (!opening.postedBy.equals(req.user._id)) throw httpError(403, 'You can only delete your own openings');

  await Promise.all([opening.deleteOne(), Placement.deleteMany({ opening: opening._id })]);
  res.json({ message: 'Opening deleted' });
});

// Records one signal per (user, type)
const recordSignal = (openingId, userId, type) =>
  Opening.updateOne(
    { _id: openingId, signals: { $not: { $elemMatch: { user: userId, type } } } },
    { $push: { signals: { user: userId, type } } }
  );

// POST /api/openings/:id/signal   body: { type: 'email' | 'apply' }
exports.signal = asyncHandler(async (req, res) => {
  const { type } = req.body;
  if (!['email', 'apply'].includes(type)) throw httpError(400, 'Invalid signal type');
  await recordSignal(req.params.id, req.user._id, type);
  res.json({ ok: true });
});

// POST /api/openings/:id/reveal-phone  (optional feature)
exports.revealPhone = asyncHandler(async (req, res) => {
  const opening = await Opening.findById(req.params.id);
  if (!opening) throw httpError(404, 'Opening not found');
  if (!opening.contactPhone) throw httpError(404, 'No phone number shared. Ask by email instead.');

  await recordSignal(opening._id, req.user._id, 'phone');
  res.json({ phone: opening.contactPhone });
});

// POST /api/openings/:id/placements  -> "Confirm successful placement"
exports.confirmPlacement = asyncHandler(async (req, res) => {
  const opening = await Opening.findById(req.params.id);
  if (!opening) throw httpError(404, 'Opening not found');
  if (opening.postedBy.equals(req.user._id)) throw httpError(400, 'You cannot confirm a placement on your own opening');

  await Placement.create({ opening: opening._id, user: req.user._id }); // duplicate -> 409 via error handler
  opening.placementCount += 1;
  await opening.save();
  res.status(201).json({ placementCount: opening.placementCount });
});

// POST /api/openings/parse-jd  (multipart: file)  -> fields to pre-fill the form (nothing is saved)
exports.parseJd = asyncHandler(async (req, res) => {
  if (!req.file) throw httpError(400, 'Attach a JD file');
  const text = await extractText(req.file);
  res.json({ fields: extractFields(text) });
});
