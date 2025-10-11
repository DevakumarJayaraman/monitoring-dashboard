type CircularProgressProps = {
  label: string;
  value: number;
  unit: string;
  maxValue: number;
  size?: number;
  showRatio?: boolean; // Whether to show value/maxValue or just value
};

function CircularProgress({ label, value, unit, maxValue, size = 80, showRatio = true }: CircularProgressProps) {
  const formattedValue = value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
  const formattedMaxValue = maxValue % 1 === 0 ? maxValue.toFixed(0) : maxValue.toFixed(1);
  const ratio = maxValue > 0 ? Math.min(value / maxValue, 1) : 0;
  const percentage = Math.round(ratio * 100);
  
  // Determine color based on percentage thresholds
  const getColorClass = (percentage: number): string => {
    if (percentage < 60) return "text-green-400";
    if (percentage >= 70 && percentage <= 85) return "text-orange-400";
    if (percentage > 80) return "text-red-400";
    return "text-yellow-400"; // fallback for 60-69%
  };
  
  const dynamicColor = getColorClass(percentage);
  
  // SVG circle parameters
  const radius = (size - 8) / 2; // Subtract stroke width
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (ratio * circumference);
  
  const displayText = showRatio ? `${formattedValue}/${formattedMaxValue}` : formattedValue;
  const tooltipText = showRatio 
    ? `${formattedValue}/${formattedMaxValue} ${unit} (${percentage}%)`
    : `${formattedValue} ${unit}`;
  
  return (
    <div className="flex flex-col items-center space-y-2">
      <div 
        className="relative"
        title={tooltipText}
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
            className={dynamicColor}
            style={{
              transition: 'stroke-dashoffset 0.5s ease-in-out',
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-xs">
          <span className="font-semibold text-slate-100 text-center leading-tight">
            {displayText}
          </span>
        </div>
      </div>
      {/* Label */}
      <div className="text-center">
        <div className="text-xs font-medium text-slate-200">{label}</div>
        <div className="text-xs text-slate-400">{unit}</div>
      </div>
    </div>
  );
}

type EcsMetrics = {
  cpu: { request: number; limit: number; unit: string };
  memory: { request: number; limit: number; unit: string };
  pods: { count: number; unit: string };
};

type SeparateProgressBarsProps = {
  metrics: EcsMetrics;
};

export function SeparateProgressBars({ metrics }: SeparateProgressBarsProps) {
  return (
    <div className="grid grid-cols-5 gap-4">
      <CircularProgress
        label="CPU Request"
        value={metrics.cpu.request}
        unit={metrics.cpu.unit}
        maxValue={metrics.cpu.limit}
        size={70}
        showRatio={true}
      />
      
      <CircularProgress
        label="CPU Limit"
        value={metrics.cpu.request}
        unit={metrics.cpu.unit}
        maxValue={metrics.cpu.limit}
        size={70}
        showRatio={true}
      />
      
      <CircularProgress
        label="Memory Request"
        value={metrics.memory.request}
        unit={metrics.memory.unit}
        maxValue={metrics.memory.limit}
        size={70}
        showRatio={true}
      />
      
      <CircularProgress
        label="Memory Limit"
        value={metrics.memory.request}
        unit={metrics.memory.unit}
        maxValue={metrics.memory.limit}
        size={70}
        showRatio={true}
      />
      
      <CircularProgress
        label="Pods"
        value={metrics.pods.count}
        unit={metrics.pods.unit}
        maxValue={metrics.pods.count}
        size={70}
        showRatio={true}
      />
    </div>
  );
}