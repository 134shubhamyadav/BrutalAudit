// ScoreRing - SVG ring that matches the existing premium-ring design exactly
export default function ScoreRing({ score = 0, size = 200, strokeWidth = 12 }) {
  const radius = (size / 2) - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : 'D';
  const gradeColor = score >= 85 ? '#10B981' : score >= 70 ? '#F59E0B' : '#EF4444';

  return (
    <div className="ring-container premium-ring big-ring">
      <svg
        className="ring-svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background track */}
        <circle
          className="ring-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Glow layer */}
        <circle
          className="ring-glow"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ stroke: gradeColor, opacity: 0.3, transition: 'stroke-dashoffset 1s ease' }}
        />
        {/* Fill layer */}
        <circle
          className="ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ stroke: gradeColor, transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="ring-center">
        <div className="ring-score">{score}</div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
          Grade {grade}
        </div>
      </div>
    </div>
  );
}
