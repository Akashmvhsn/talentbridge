// "3d ago", "just now", ...
export function timeAgo(date) {
  if (!date) return '';
  const s = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  const steps = [
    [60, 'just now'],
    [3600, (v) => `${Math.floor(v / 60)}m ago`],
    [86400, (v) => `${Math.floor(v / 3600)}h ago`],
    [604800, (v) => `${Math.floor(v / 86400)}d ago`],
    [2629800, (v) => `${Math.floor(v / 604800)}w ago`],
    [31557600, (v) => `${Math.floor(v / 2629800)}mo ago`],
  ];
  for (const [limit, out] of steps) if (s < limit) return typeof out === 'function' ? out(s) : out;
  return `${Math.floor(s / 31557600)}y ago`;
}

export const isNew = (date) => date && Date.now() - new Date(date).getTime() < 3 * 86400 * 1000;

export const initials = (name = '') =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

// Stable hue per company so monograms stay consistent across the app
export function hueFor(text = '') {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 360;
  return h;
}

// 0 → Newcomer ... trust levels shown on the profile
export const TRUST_LEVELS = [
  { min: 0, name: 'Newcomer' },
  { min: 1, name: 'Connector' },
  { min: 3, name: 'Trusted lister' },
  { min: 10, name: 'Talent champion' },
];

export function trustLevel(placements) {
  let i = 0;
  while (i + 1 < TRUST_LEVELS.length && placements >= TRUST_LEVELS[i + 1].min) i++;
  const cur = TRUST_LEVELS[i];
  const next = TRUST_LEVELS[i + 1];
  const progress = next ? (placements - cur.min) / (next.min - cur.min) : 1;
  return { ...cur, next, progress };
}
