const engines = [
  { id: "n8n", x: 18, y: 28 },
  { id: "Kestra", x: 72, y: 22 },
  { id: "Temporal", x: 50, y: 48 },
  { id: "ActivePieces", x: 24, y: 72 },
  { id: "Trigger.dev", x: 76, y: 68 },
];

export function EngineConstellation() {
  return (
    <div className="animate-drift relative h-full min-h-[420px] w-full overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 60% 40%, rgba(46,196,182,0.22), transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(232,184,109,0.12), transparent 45%), linear-gradient(160deg, #0a1a26 0%, #071018 55%, #0d2430 100%)",
        }}
      />
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="beam" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2ec4b6" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#2ec4b6" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#2ec4b6" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {[
          [18, 28, 50, 48],
          [72, 22, 50, 48],
          [24, 72, 50, 48],
          [76, 68, 50, 48],
          [18, 28, 24, 72],
          [72, 22, 76, 68],
        ].map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="url(#beam)"
            strokeWidth="0.35"
            className="animate-pulse-line"
            style={{ animationDelay: `${i * 0.35}s` }}
          />
        ))}
        {/* Master hub */}
        <circle cx="50" cy="48" r="3.2" fill="#2ec4b6" opacity="0.95" />
        <circle cx="50" cy="48" r="6" fill="none" stroke="#2ec4b6" strokeOpacity="0.35" />
        {engines.map((e) => (
          <g key={e.id}>
            <circle cx={e.x} cy={e.y} r="2.1" fill="#e8f2f6" />
            <circle
              cx={e.x}
              cy={e.y}
              r="4.2"
              fill="none"
              stroke="#9eb6c4"
              strokeOpacity="0.35"
            />
          </g>
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col justify-between p-8 sm:p-10">
        <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.22em] text-fog">
          Control plane
        </p>
        <ul className="space-y-2 self-end text-right font-[family-name:var(--font-mono)] text-xs text-fog sm:text-sm">
          {engines.map((e) => (
            <li key={e.id} className="text-snow/80">
              {e.id}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
