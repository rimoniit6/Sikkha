'use client'

export function BookLoader() {
  return (
    <div className="relative flex items-center justify-center animate-fade-in" aria-hidden="true">
      <div className="relative animate-float">
        <svg
          width={140}
          height={110}
          viewBox="0 0 140 110"
          className="drop-shadow-xl"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="coverGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
            <linearGradient id="pageGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
            <linearGradient id="glowGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="rgba(16,185,129,0.3)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <filter id="softGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="shadow">
              <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.15)" />
            </filter>
          </defs>

          {/* Pages */}
          {Array.from({ length: 4 }, (_, i) => (
            <rect
              key={`page-${i}`}
              x={10 + 3 + i * 2}
              y={10 + 3 + i * 0.6}
              width={120 - 8 - i * 2}
              height={90 - i * 0.6}
              rx={2}
              fill="url(#pageGrad)"
              className="animate-pulse-soft"
              style={{ animationDelay: `${i * 0.08}s` }}
            />
          ))}

          {/* Glow highlight */}
          <rect
            x={14 + 3}
            y={14 + 3}
            width={120 - 8 - 8}
            height={90 - 8}
            rx={2}
            fill="url(#glowGrad)"
            filter="url(#softGlow)"
            className="animate-float"
          />

          {/* Back cover */}
          <rect
            x={10}
            y={10}
            width={120}
            height={90}
            rx={3}
            fill="none"
            stroke="#059669"
            strokeWidth={3}
            filter="url(#shadow)"
            className="animate-pulse-soft"
            style={{ transformOrigin: '10px' }}
          />

          {/* Front cover (slightly open) */}
          <rect
            x={10}
            y={10}
            width={120}
            height={90}
            rx={3}
            fill="url(#coverGrad)"
            fillOpacity={0.9}
            className="animate-pulse-soft"
            style={{ transformOrigin: '10px', animationDelay: '0.1s' }}
          />

          {/* Spine */}
          <rect
            x={10}
            y={10}
            width={8}
            height={90}
            rx={2}
            fill="#14b8a6"
            className="animate-pulse-soft"
            style={{ animationDelay: '0.2s' }}
          />

          {/* Book lines decoration */}
          <line x1={24} y1={30} x2={124} y2={30} stroke="#059669" strokeWidth={1.5} strokeOpacity={0.3} strokeLinecap="round" />
          <line x1={24} y1={44} x2={124} y2={44} stroke="#059669" strokeWidth={1.5} strokeOpacity={0.3} strokeLinecap="round" />
          <line x1={24} y1={58} x2={124} y2={58} stroke="#059669" strokeWidth={1.5} strokeOpacity={0.3} strokeLinecap="round" />
        </svg>
      </div>
    </div>
  )
}
