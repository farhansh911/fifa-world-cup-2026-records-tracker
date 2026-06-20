export function FootballBall({ className = "", size = 64 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="32" cy="32" r="30" fill="url(#ballGradient)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <path
        d="M32 8 L38 18 L32 22 L26 18 Z M32 56 L38 46 L32 42 L26 46 Z M8 32 L18 26 L22 32 L18 38 Z M56 32 L46 38 L42 32 L46 26 Z"
        fill="rgba(255,255,255,0.85)"
      />
      <path
        d="M32 22 L38 18 L46 26 L42 32 L38 46 L32 42 L26 46 L22 32 L18 26 L26 18 Z"
        fill="none"
        stroke="rgba(255,255,255,0.9)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <defs>
        <radialGradient id="ballGradient" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#e8e8e8" />
          <stop offset="100%" stopColor="#b0b0b0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
