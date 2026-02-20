"use client";

interface ScoreGaugeProps {
  score: number;
  category: string;
}

export default function ScoreGauge({ score, category }: ScoreGaugeProps) {
  const maxScore = 100;
  const clampedScore = Math.min(Math.max(score, 0), maxScore);
  const percentage = clampedScore / maxScore;

  // Arc from -135deg to +135deg (270deg total)
  const totalAngle = 270;
  const startAngle = -135;
  const sweepAngle = percentage * totalAngle;
  const endAngle = startAngle + sweepAngle;

  const radius = 80;
  const cx = 100;
  const cy = 100;

  function polarToCartesian(angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  const bgStart = polarToCartesian(startAngle);
  const bgEnd = polarToCartesian(startAngle + totalAngle);

  const arcStart = polarToCartesian(startAngle);
  const arcEnd = polarToCartesian(endAngle);
  const largeArc = sweepAngle > 180 ? 1 : 0;

  const bgPath = `M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 1 1 ${bgEnd.x} ${bgEnd.y}`;
  const arcPath = `M ${arcStart.x} ${arcStart.y} A ${radius} ${radius} 0 ${largeArc} 1 ${arcEnd.x} ${arcEnd.y}`;

  let color: string;
  if (score >= 85) color = "#22c55e";
  else if (score >= 70) color = "#3b82f6";
  else if (score >= 50) color = "#f59e0b";
  else color = "#ef4444";

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 160" className="w-56 h-auto">
        <path
          d={bgPath}
          fill="none"
          stroke="#e5e5e5"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {clampedScore > 0 && (
          <path
            d={arcPath}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 8px ${color}60)`,
            }}
          />
        )}
        <text
          x={cx}
          y={cy - 5}
          textAnchor="middle"
          className="fill-gray-900 text-4xl font-bold"
          style={{ fontSize: "36px" }}
        >
          {clampedScore}
        </text>
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          className="fill-gray-400"
          style={{ fontSize: "11px" }}
        >
          / {maxScore}
        </text>
      </svg>
      <div
        className="mt-1 text-sm font-semibold px-3 py-1 rounded-full"
        style={{ color, backgroundColor: `${color}15` }}
      >
        {category}
      </div>
    </div>
  );
}
