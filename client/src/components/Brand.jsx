// Bridge mark used in nav, auth and splash
export function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="logo-mark">
      <defs>
        <linearGradient id="tb-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0b3d2e" />
          <stop offset="1" stopColor="#34c98f" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#tb-g)" />
      <path d="M14 40c8-14 28-14 36 0" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="14" cy="42" r="4" fill="#fff" />
      <circle cx="50" cy="42" r="4" fill="#fff" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="wordmark">
      <Logo size={34} />
      <span>Talent<b>Bridge</b></span>
    </span>
  );
}
