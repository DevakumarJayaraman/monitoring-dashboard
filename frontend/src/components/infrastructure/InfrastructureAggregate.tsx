import type { JSX } from "react";
import type { InfraDetail, InfraMetrics, EcsMetrics, InfraType } from "../../types/infrastructure.ts";

interface InfrastructureAggregateProps {
  machines: InfraDetail[];
  environment: string;
  region: string;
  onInfraTypeClick?: (infraType: InfraType | 'ALL') => void;
  selectedInfraType?: InfraType | 'ALL';
}

export function InfrastructureAggregate({
  machines,
  environment,
  region,
  onInfraTypeClick,
  selectedInfraType = 'ALL',
}: InfrastructureAggregateProps): JSX.Element {
  
  // Separate machines by type
  const linuxMachines = machines.filter(m => m.infraType === 'linux');
  const windowsMachines = machines.filter(m => m.infraType === 'windows');
  const ecsMachines = machines.filter(m => m.infraType === 'ecs');

  // Calculate aggregates for Linux
  const linuxAggregate = linuxMachines.reduce((acc, machine) => {
    const metrics = machine.metrics as InfraMetrics;
    return {
      cpuUsage: acc.cpuUsage + metrics.cpu.usage,
      cpuLimit: acc.cpuLimit + metrics.cpu.limit,
      memoryUsage: acc.memoryUsage + metrics.memory.usage,
      memoryLimit: acc.memoryLimit + metrics.memory.limit,
      count: acc.count + 1,
    };
  }, { cpuUsage: 0, cpuLimit: 0, memoryUsage: 0, memoryLimit: 0, count: 0 });

  // Calculate aggregates for Windows
  const windowsAggregate = windowsMachines.reduce((acc, machine) => {
    const metrics = machine.metrics as InfraMetrics;
    return {
      cpuUsage: acc.cpuUsage + metrics.cpu.usage,
      cpuLimit: acc.cpuLimit + metrics.cpu.limit,
      memoryUsage: acc.memoryUsage + metrics.memory.usage,
      memoryLimit: acc.memoryLimit + metrics.memory.limit,
      count: acc.count + 1,
    };
  }, { cpuUsage: 0, cpuLimit: 0, memoryUsage: 0, memoryLimit: 0, count: 0 });

  // Calculate aggregates for ECS
  const ecsAggregate = ecsMachines.reduce((acc, machine) => {
    const metrics = machine.metrics as EcsMetrics;
    return {
      cpuRequest: acc.cpuRequest + metrics.cpu.request,
      cpuLimit: acc.cpuLimit + metrics.cpu.limit,
      memoryRequest: acc.memoryRequest + metrics.memory.request,
      memoryLimit: acc.memoryLimit + metrics.memory.limit,
      podsCount: acc.podsCount + (metrics.pods?.count || 0),
      count: acc.count + 1,
    };
  }, { cpuRequest: 0, cpuLimit: 0, memoryRequest: 0, memoryLimit: 0, podsCount: 0, count: 0 });

  const calculatePercentage = (used: number, total: number) => {
    return total > 0 ? Math.round((used / total) * 100) : 0;
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return "text-red-400";
    if (percentage >= 75) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="mb-4">
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300">
            Aggregate Summary: {environment} • {region}
          </h3>
        </div>
        
        <div className="flex items-stretch gap-4">
          {/* Linux Aggregate */}
          {linuxAggregate.count > 0 && (
            <div 
              onClick={() => onInfraTypeClick?.(selectedInfraType === 'linux' ? 'ALL' : 'linux')}
              className={`flex-1 rounded-lg border p-3 cursor-pointer transition-all hover:scale-[1.02] ${
                selectedInfraType === 'linux'
                  ? 'border-emerald-400 bg-emerald-500/20 ring-2 ring-emerald-400/50'
                  : 'border-emerald-400/30 bg-emerald-500/5 hover:border-emerald-400/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-emerald-300">Linux</h4>
                  <p className="text-xs text-slate-400">{linuxAggregate.count} machine{linuxAggregate.count !== 1 ? 's' : ''}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">CPU</span>
                  <span className={`font-semibold ${getUsageColor(calculatePercentage(linuxAggregate.cpuUsage, linuxAggregate.cpuLimit))}`}>
                    {calculatePercentage(linuxAggregate.cpuUsage, linuxAggregate.cpuLimit)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(calculatePercentage(linuxAggregate.cpuUsage, linuxAggregate.cpuLimit), 100)}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400">
                  {linuxAggregate.cpuUsage.toFixed(1)} / {linuxAggregate.cpuLimit.toFixed(1)} cores
                </div>
                
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-300">Memory</span>
                  <span className={`font-semibold ${getUsageColor(calculatePercentage(linuxAggregate.memoryUsage, linuxAggregate.memoryLimit))}`}>
                    {calculatePercentage(linuxAggregate.memoryUsage, linuxAggregate.memoryLimit)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(calculatePercentage(linuxAggregate.memoryUsage, linuxAggregate.memoryLimit), 100)}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400">
                  {linuxAggregate.memoryUsage.toFixed(1)} / {linuxAggregate.memoryLimit.toFixed(1)} GB
                </div>
              </div>
            </div>
          )}

          {/* Windows Aggregate */}
          {windowsAggregate.count > 0 && (
            <div 
              onClick={() => onInfraTypeClick?.(selectedInfraType === 'windows' ? 'ALL' : 'windows')}
              className={`flex-1 rounded-lg border p-3 cursor-pointer transition-all hover:scale-[1.02] ${
                selectedInfraType === 'windows'
                  ? 'border-sky-400 bg-sky-500/20 ring-2 ring-sky-400/50'
                  : 'border-sky-400/30 bg-sky-500/5 hover:border-sky-400/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <svg className="h-4 w-4 text-sky-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M0 3.45v6.55l10-1.27v-6.55l-10 1.27zm11 1.15v6.4l13-1.7v-6.4l-13 1.7zm-11 7.75v6.55l10 1.27v-6.55l-10-1.27zm11 1.15v6.4l13 1.7v-6.4l-13-1.7z" />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-sky-300">Windows</h4>
                  <p className="text-xs text-slate-400">{windowsAggregate.count} machine{windowsAggregate.count !== 1 ? 's' : ''}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">CPU</span>
                  <span className={`font-semibold ${getUsageColor(calculatePercentage(windowsAggregate.cpuUsage, windowsAggregate.cpuLimit))}`}>
                    {calculatePercentage(windowsAggregate.cpuUsage, windowsAggregate.cpuLimit)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                  <div 
                    className="h-full bg-sky-500 transition-all"
                    style={{ width: `${Math.min(calculatePercentage(windowsAggregate.cpuUsage, windowsAggregate.cpuLimit), 100)}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400">
                  {windowsAggregate.cpuUsage.toFixed(1)} / {windowsAggregate.cpuLimit.toFixed(1)} cores
                </div>
                
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-300">Memory</span>
                  <span className={`font-semibold ${getUsageColor(calculatePercentage(windowsAggregate.memoryUsage, windowsAggregate.memoryLimit))}`}>
                    {calculatePercentage(windowsAggregate.memoryUsage, windowsAggregate.memoryLimit)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                  <div 
                    className="h-full bg-sky-500 transition-all"
                    style={{ width: `${Math.min(calculatePercentage(windowsAggregate.memoryUsage, windowsAggregate.memoryLimit), 100)}%` }}
                  />
                </div>
                <div className="text-xs text-slate-400">
                  {windowsAggregate.memoryUsage.toFixed(1)} / {windowsAggregate.memoryLimit.toFixed(1)} GB
                </div>
              </div>
            </div>
          )}

          {/* ECS Aggregate */}
          {ecsAggregate.count > 0 && (
            <div 
              onClick={() => onInfraTypeClick?.(selectedInfraType === 'ecs' ? 'ALL' : 'ecs')}
              className={`flex-[2] rounded-lg border p-3 cursor-pointer transition-all hover:scale-[1.02] ${
                selectedInfraType === 'ecs'
                  ? 'border-violet-400 bg-violet-500/20 ring-2 ring-violet-400/50'
                  : 'border-violet-400/30 bg-violet-500/5 hover:border-violet-400/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <svg className="h-4 w-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-violet-300">ECS</h4>
                  <p className="text-xs text-slate-400">{ecsAggregate.count} cluster{ecsAggregate.count !== 1 ? 's' : ''}</p>
                </div>
              </div>
              
              {/* Compact Grid Layout */}
              <div className="grid grid-cols-5 gap-2">
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-1">CPU Req</div>
                  <CircularProgress
                    label=""
                    value={ecsAggregate.cpuRequest}
                    unit="cores"
                    maxValue={ecsAggregate.cpuLimit}
                    size={50}
                    showRatio={true}
                    compact={true}
                  />
                </div>
                
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-1">CPU Lmt</div>
                  <CircularProgress
                    label=""
                    value={ecsAggregate.cpuLimit}
                    unit="cores"
                    maxValue={ecsAggregate.cpuLimit}
                    size={50}
                    showRatio={false}
                    compact={true}
                  />
                </div>
                
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-1">Mem Req</div>
                  <CircularProgress
                    label=""
                    value={ecsAggregate.memoryRequest}
                    unit="GiB"
                    maxValue={ecsAggregate.memoryLimit}
                    size={50}
                    showRatio={true}
                    compact={true}
                  />
                </div>
                
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-1">Mem Lmt</div>
                  <CircularProgress
                    label=""
                    value={ecsAggregate.memoryLimit}
                    unit="GiB"
                    maxValue={ecsAggregate.memoryLimit}
                    size={50}
                    showRatio={false}
                    compact={true}
                  />
                </div>
                
                <div className="text-center">
                  <div className="text-xs text-slate-400 mb-1">Pods</div>
                  <CircularProgress
                    label=""
                    value={ecsAggregate.podsCount}
                    unit="pods"
                    maxValue={ecsAggregate.podsCount}
                    size={50}
                    showRatio={false}
                    compact={true}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Circular Progress Component (compact version for ECS)
type CircularProgressProps = {
  label: string;
  value: number;
  unit: string;
  maxValue: number;
  size?: number;
  showRatio?: boolean;
  compact?: boolean;
};

function CircularProgress({ label, value, unit, maxValue, size = 80, showRatio = true, compact = false }: CircularProgressProps) {
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
    <div className="flex flex-col items-center">
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
            strokeWidth="3"
            fill="none"
            className="text-slate-800"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
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
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-semibold text-slate-100 text-center leading-tight" style={{ fontSize: compact ? '0.65rem' : '0.75rem' }}>
            {displayText}
          </span>
        </div>
      </div>
      {/* Label */}
      {!compact && label && (
        <div className="text-center mt-1">
          <div className="text-xs font-medium text-slate-200">{label}</div>
          <div className="text-xs text-slate-400">{unit}</div>
        </div>
      )}
    </div>
  );
}
