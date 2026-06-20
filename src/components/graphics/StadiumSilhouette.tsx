export function StadiumSilhouette({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 800 200"
      preserveAspectRatio="xMidYMax meet"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="stadiumGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(75,29,149,0.4)" />
          <stop offset="100%" stopColor="rgba(75,29,149,0)" />
        </linearGradient>
        <linearGradient id="lightsGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,217,255,0.3)" />
          <stop offset="100%" stopColor="rgba(0,217,255,0)" />
        </linearGradient>
      </defs>
      {/* Stadium bowl */}
      <path
        d="M0 200 L0 120 Q100 60 200 80 Q300 40 400 50 Q500 40 600 80 Q700 60 800 120 L800 200 Z"
        fill="url(#stadiumGrad)"
      />
      {/* Floodlight beams */}
      {[120, 280, 400, 520, 680].map((x, i) => (
        <g key={i}>
          <line x1={x} y1="30" x2={x - 40 + i * 5} y2="100" stroke="url(#lightsGrad)" strokeWidth="1" opacity="0.5" />
          <circle cx={x} cy="28" r="6" fill="rgba(245,197,66,0.6)" />
          <circle cx={x} cy="28" r="12" fill="rgba(245,197,66,0.15)" />
        </g>
      ))}
      {/* Crowd dots */}
      {Array.from({ length: 40 }).map((_, i) => (
        <circle
          key={i}
          cx={20 + i * 19}
          cy={95 + Math.sin(i) * 8}
          r="1.5"
          fill={`rgba(255,255,255,${0.05 + (i % 3) * 0.03})`}
        />
      ))}
    </svg>
  );
}
