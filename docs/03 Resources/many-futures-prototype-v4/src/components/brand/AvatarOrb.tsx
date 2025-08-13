// React import not required for React 17+ with jsx runtime

type AvatarOrbProps = {
  size?: number; // px
  ariaLabel?: string;
  className?: string;
};

export function AvatarOrb({ size = 96, ariaLabel = 'Futura', className }: AvatarOrbProps) {
  const s = size;
  const r = s / 2;
  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      role="img"
      aria-label={ariaLabel}
      className={className}
    >
      <defs>
        <radialGradient id="orbGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#B08BFF" />
          <stop offset="60%" stopColor="#6E56CF" />
          <stop offset="100%" stopColor="#4A3AA5" />
        </radialGradient>
        <filter id="orbGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx={r} cy={r} r={r - 2} fill="url(#orbGradient)" filter="url(#orbGlow)" />
    </svg>
  );
}


