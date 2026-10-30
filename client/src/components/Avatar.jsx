import { hueFor, initials } from '../lib/format.js';

// Gradient monogram for people and companies
export default function Avatar({ name = '', size = 44, square = false }) {
  const h = hueFor(name);
  return (
    <span
      className={`monogram${square ? ' square' : ''}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: `linear-gradient(135deg, hsl(${h} 62% 40%), hsl(${(h + 40) % 360} 68% 56%))`,
      }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
