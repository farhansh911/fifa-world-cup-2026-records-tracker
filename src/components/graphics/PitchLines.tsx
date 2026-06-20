export function PitchLines({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden
    >
      <rect width="1200" height="600" fill="transparent" />
      {/* Outer boundary */}
      <rect x="60" y="40" width="1080" height="520" stroke="rgba(255,255,255,0.06)" strokeWidth="2" rx="4" />
      {/* Center line */}
      <line x1="600" y1="40" x2="600" y2="560" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
      {/* Center circle */}
      <circle cx="600" cy="300" r="80" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
      <circle cx="600" cy="300" r="4" fill="rgba(0,217,255,0.2)" />
      {/* Left penalty area */}
      <rect x="60" y="170" width="180" height="260" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
      <rect x="60" y="230" width="70" height="140" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
      {/* Right penalty area */}
      <rect x="960" y="170" width="180" height="260" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
      <rect x="1070" y="230" width="70" height="140" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
      {/* Corner arcs */}
      <path d="M 60 40 A 20 20 0 0 1 80 60" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
      <path d="M 1140 40 A 20 20 0 0 0 1120 60" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
      <path d="M 60 560 A 20 20 0 0 0 80 540" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
      <path d="M 1140 560 A 20 20 0 0 1 1120 540" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
    </svg>
  );
}
