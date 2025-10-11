import type { InfraDetail, InfraType } from "../../types/infrastructure.ts";

type InfraMetricsSummary = {
  totalMachines: number;
  totalServices: number;
  cpu: {
    totalUsed: number;
    totalAvailable: number;
    unit: string;
  };
  memory: {
    totalUsed: number;
    totalAvailable: number;
    unit: string;
  };
  pods?: {
    totalCount: number;
    unit: string;
  };
  averageUtilization: {
    cpu: number;
    memory: number;
  };
};

type RegionEnvironmentTypeSummary = {
  region: string;
  environment: string;
  infraType: InfraType;
  metrics: InfraMetricsSummary;
};

type InfraSummaryCardProps = {
  infraDetails: InfraDetail[];
  onSummaryCardClick?: (region: string, environment: string, infraType: string) => void;
  selectedFilter?: {
    region: string;
    environment: string;
    infraType: string;
  } | null;
};

function calculateInfraSummary(infraDetails: InfraDetail[]): RegionEnvironmentTypeSummary[] {
  const summaryMap = new Map<string, InfraMetricsSummary>();
  const keyToInfoMap = new Map<string, { region: string; environment: string; infraType: InfraType }>();

  infraDetails.forEach((detail) => {
    const key = `${detail.region}-${detail.environment}-${detail.infraType}`;
    keyToInfoMap.set(key, { 
      region: detail.region, 
      environment: detail.environment, 
      infraType: detail.infraType 
    });
    
    if (!summaryMap.has(key)) {
      summaryMap.set(key, {
        totalMachines: 0,
        totalServices: 0,
        cpu: { totalUsed: 0, totalAvailable: 0, unit: '' },
        memory: { totalUsed: 0, totalAvailable: 0, unit: '' },
        pods: detail.infraType === 'ecs' ? { totalCount: 0, unit: 'pods' } : undefined,
        averageUtilization: { cpu: 0, memory: 0 },
      });
    }
    
    const summary = summaryMap.get(key)!;
    summary.totalMachines += 1;
    summary.totalServices += detail.servicesInstances.length;
    
    if ('pods' in detail.metrics && detail.infraType === 'ecs') {
      // ECS metrics
      summary.cpu.totalUsed += detail.metrics.cpu.request;
      summary.cpu.totalAvailable += detail.metrics.cpu.limit;
      summary.cpu.unit = detail.metrics.cpu.unit;
      summary.memory.totalUsed += detail.metrics.memory.request;
      summary.memory.totalAvailable += detail.metrics.memory.limit;
      summary.memory.unit = detail.metrics.memory.unit;
      if (summary.pods) {
        summary.pods.totalCount += detail.metrics.pods.count;
      }
    } else {
      // VM metrics (Linux/Windows) - need to cast to InfraMetricsEntry
      const vmMetrics = detail.metrics as { cpu: { usage: number; limit: number; unit: string }; memory: { usage: number; limit: number; unit: string } };
      summary.cpu.totalUsed += vmMetrics.cpu.usage;
      summary.cpu.totalAvailable += vmMetrics.cpu.limit;
      summary.cpu.unit = vmMetrics.cpu.unit;
      summary.memory.totalUsed += vmMetrics.memory.usage;
      summary.memory.totalAvailable += vmMetrics.memory.limit;
      summary.memory.unit = vmMetrics.memory.unit;
    }
  });

  // Calculate average utilization
  summaryMap.forEach((summary) => {
    summary.averageUtilization.cpu = summary.cpu.totalAvailable > 0 
      ? (summary.cpu.totalUsed / summary.cpu.totalAvailable) * 100 
      : 0;
    summary.averageUtilization.memory = summary.memory.totalAvailable > 0 
      ? (summary.memory.totalUsed / summary.memory.totalAvailable) * 100 
      : 0;
  });

  return Array.from(summaryMap.entries()).map(([key, metrics]) => ({
    ...keyToInfoMap.get(key)!,
    metrics,
  })).sort((a, b) => {
    // Sort by region, then environment, then infraType
    const regionCompare = a.region.localeCompare(b.region);
    if (regionCompare !== 0) return regionCompare;
    
    const envCompare = a.environment.localeCompare(b.environment);
    if (envCompare !== 0) return envCompare;
    
    return a.infraType.localeCompare(b.infraType);
  });
}

function getInfraTypeConfig(infraType: InfraType) {
  const configs = {
    ecs: {
      label: 'ECS Clusters',
      bgClass: 'bg-amber-500/5 border-amber-400/50',
      iconColor: 'text-amber-300'
    },
    linux: {
      label: 'Linux VMs',
      bgClass: 'bg-emerald-500/5 border-emerald-400/50',
      iconColor: 'text-emerald-300'
    },
    windows: {
      label: 'Windows VMs',
      bgClass: 'bg-blue-500/5 border-blue-400/50',
      iconColor: 'text-blue-300'
    }
  };
  return configs[infraType];
}

function MetricSummaryItem({ label, value, unit, utilization }: { 
  label: string; 
  value: string; 
  unit: string; 
  utilization?: number; 
}) {
  const getUtilizationColor = (util: number): string => {
    if (util < 60) return "text-green-400";
    if (util >= 70 && util <= 85) return "text-orange-400";
    if (util > 80) return "text-red-400";
    return "text-yellow-400";
  };

  return (
    <div className="text-center">
      <div className="text-sm font-semibold text-slate-200">{value} {unit}</div>
      <div className="text-xs text-slate-400">{label}</div>
      {utilization !== undefined && (
        <div className={`text-xs font-medium ${getUtilizationColor(utilization)}`}>
          {Math.round(utilization)}%
        </div>
      )}
    </div>
  );
}

export function InfraSummaryCard({ infraDetails, onSummaryCardClick, selectedFilter }: InfraSummaryCardProps) {
  const summaries = calculateInfraSummary(infraDetails);

  if (summaries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-100">Infrastructure Summary</h3>
      <div className="grid gap-4 lg:grid-cols-2">
        {summaries.map(({ region, environment, infraType, metrics }) => {
          const typeConfig = getInfraTypeConfig(infraType);
          const machineLabel = infraType === 'ecs' ? 'clusters' : 'machines';
          
          // Check if this card is currently selected
          const isSelected = selectedFilter &&
            selectedFilter.region === region &&
            selectedFilter.environment === environment &&
            selectedFilter.infraType === infraType;
          
          return (
            <div
              key={`${region}-${environment}-${infraType}`}
              className={`rounded-2xl border p-6 shadow-inner transition-all cursor-pointer hover:shadow-lg ${typeConfig.bgClass} ${
                onSummaryCardClick ? 'hover:scale-[1.02]' : ''
              } ${
                isSelected 
                  ? 'ring-2 ring-emerald-400/70 ring-offset-2 ring-offset-slate-950 shadow-lg shadow-emerald-400/20' 
                  : ''
              }`}
              onClick={() => onSummaryCardClick?.(region, environment, infraType)}
              role={onSummaryCardClick ? "button" : undefined}
              tabIndex={onSummaryCardClick ? 0 : undefined}
            >
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="text-base font-semibold text-slate-100">
                    {region} • {environment}
                  </h4>
                  <span className={`text-sm font-medium ${typeConfig.iconColor}`}>
                    {typeConfig.label}
                  </span>
                </div>
                <div className="text-sm text-slate-400">
                  {metrics.totalMachines} {machineLabel} • {metrics.totalServices} services
                  {metrics.pods && ` • ${metrics.pods.totalCount} ${metrics.pods.unit}`}
                </div>
              </div>
              
              <div className={`grid gap-6 ${infraType === 'ecs' && metrics.pods ? 'grid-cols-5' : 'grid-cols-4'}`}>
                <MetricSummaryItem
                  label={infraType === 'ecs' ? "CPU Request" : "CPU Used"}
                  value={metrics.cpu.totalUsed.toFixed(1)}
                  unit={metrics.cpu.unit}
                  utilization={metrics.averageUtilization.cpu}
                />
                
                <MetricSummaryItem
                  label={infraType === 'ecs' ? "CPU Limit" : "CPU Available"}
                  value={metrics.cpu.totalAvailable.toFixed(1)}
                  unit={metrics.cpu.unit}
                />
                
                <MetricSummaryItem
                  label={infraType === 'ecs' ? "Memory Request" : "Memory Used"}
                  value={metrics.memory.totalUsed.toFixed(1)}
                  unit={metrics.memory.unit}
                  utilization={metrics.averageUtilization.memory}
                />
                
                <MetricSummaryItem
                  label={infraType === 'ecs' ? "Memory Limit" : "Memory Available"}
                  value={metrics.memory.totalAvailable.toFixed(1)}
                  unit={metrics.memory.unit}
                />
                
                {metrics.pods && (
                  <MetricSummaryItem
                    label="Total Pods"
                    value={metrics.pods.totalCount.toString()}
                    unit={metrics.pods.unit}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}