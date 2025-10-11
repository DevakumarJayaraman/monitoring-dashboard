type CircularMetricProps = {
  label: string;
  usage: number;
  limit: number;
  unit: string;
  color: string;
  size?: number;
  showAsCount?: boolean; // For discrete values like pods
};

export function CircularMetric({ 
  label, 
  usage, 
  limit, 
  unit, 
  color, 
  size = 80,
  showAsCount = false
}: CircularMetricProps) {
  const ratio = showAsCount ? 1 : (limit > 0 ? Math.min(usage / limit, 1) : 0);
  const percentage = Math.round(ratio * 100);
  const formattedUsage = usage % 1 === 0 ? usage.toFixed(0) : usage.toFixed(1);
  const formattedLimit = limit % 1 === 0 ? limit.toFixed(0) : limit.toFixed(1);
  
  // SVG circle parameters
  const radius = (size - 8) / 2; // Subtract stroke width
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (ratio * circumference);
  
  return (
    <div className="flex flex-col items-center space-y-2">
      <div 
        className="relative"
        title={showAsCount ? `${formattedUsage} ${unit}` : `${formattedUsage}/${formattedLimit} ${unit} (${percentage}%)`}
      >
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-slate-800"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={color}
            style={{
              transition: 'stroke-dashoffset 0.5s ease-in-out',
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-xs">
          {showAsCount ? (
            <span className="font-semibold text-slate-100">{formattedUsage}</span>
          ) : (
            <span className="font-semibold text-slate-100">{percentage}%</span>
          )}
        </div>
      </div>
      {/* Label and values */}
      <div className="text-center">
        <div className="text-xs font-medium text-slate-200">{label}</div>
        <div className="text-xs text-slate-400">
          {showAsCount ? (
            `${formattedUsage} ${unit}`
          ) : (
            `${formattedUsage}/${formattedLimit} ${unit}`
          )}
        </div>
      </div>
    </div>
  );
}