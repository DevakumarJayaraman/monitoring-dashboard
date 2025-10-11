import type { JSX } from "react";
import type { InfraDetail } from "../../types/infrastructure.ts";

type InfraSummaryStats = {
  environment: string;
  region: string;
  totalMachines: number;
  linuxCount: number;
  windowsCount: number;
  ecsCount: number;
  healthyCount: number;
  watchCount: number;
  scalingCount: number;
  healthPercentage: number;
};

interface InfrastructureSummaryProps {
  infraDetails: InfraDetail[];
  onCardClick: (environment: string, region: string) => void;
  selectedFilter: { environment: string; region: string } | null;
}

export function InfrastructureSummary({
  infraDetails,
  onCardClick,
  selectedFilter,
}: InfrastructureSummaryProps): JSX.Element {
  
  // Calculate summary statistics grouped by Environment and Region
  const summaryStats = (): InfraSummaryStats[] => {
    const stats = new Map<string, InfraSummaryStats>();

    infraDetails.forEach(machine => {
      const key = `${machine.environment}-${machine.region}`;
      
      if (!stats.has(key)) {
        stats.set(key, {
          environment: machine.environment,
          region: machine.region,
          totalMachines: 0,
          linuxCount: 0,
          windowsCount: 0,
          ecsCount: 0,
          healthyCount: 0,
          watchCount: 0,
          scalingCount: 0,
          healthPercentage: 0,
        });
      }

      const stat = stats.get(key)!;
      stat.totalMachines++;

      // Count by infrastructure type
      if (machine.infraType === 'linux') stat.linuxCount++;
      else if (machine.infraType === 'windows') stat.windowsCount++;
      else if (machine.infraType === 'ecs') stat.ecsCount++;

      // Count by status
      if (machine.status === 'healthy') stat.healthyCount++;
      else if (machine.status === 'watch') stat.watchCount++;
      else if (machine.status === 'scaling') stat.scalingCount++;
    });

    // Calculate health percentage
    stats.forEach(stat => {
      stat.healthPercentage = stat.totalMachines > 0
        ? Math.round((stat.healthyCount / stat.totalMachines) * 100)
        : 0;
    });

    return Array.from(stats.values());
  };

  const stats = summaryStats();

  // Sort by environment then region
  const sortedStats = [...stats].sort((a, b) => {
    const envOrder = ['DEV', 'UAT', 'STAGING', 'PROD', 'COB'];
    const envAIndex = envOrder.indexOf(a.environment);
    const envBIndex = envOrder.indexOf(b.environment);
    
    if (envAIndex !== envBIndex) {
      return envAIndex - envBIndex;
    }
    return a.region.localeCompare(b.region);
  });

  const envTypeLabels: Record<string, string> = {
    'DEV': 'DEV',
    'UAT': 'UAT',
    'STAGING': 'UAT',
    'PROD': 'PROD',
    'COB': 'COB',
  };

  const getEnvBadgeColor = (env: string): string => {
    const colors: Record<string, string> = {
      'DEV': 'bg-blue-500/20 text-blue-300 border-blue-400/30',
      'UAT': 'bg-amber-500/20 text-amber-300 border-amber-400/30',
      'STAGING': 'bg-amber-500/20 text-amber-300 border-amber-400/30',
      'PROD': 'bg-red-500/20 text-red-300 border-red-400/30',
      'COB': 'bg-purple-500/20 text-purple-300 border-purple-400/30',
    };
    return colors[env] || 'bg-slate-500/20 text-slate-300 border-slate-400/30';
  };

  const getRegionConfig = (region: string) => {
    const configs: Record<string, { bgClass: string; accentColor: string; icon: string }> = {
      APAC: {
        bgClass: 'bg-emerald-500/5 border-emerald-400/50',
        accentColor: 'text-emerald-300',
        icon: '🌏',
      },
      EMEA: {
        bgClass: 'bg-blue-500/5 border-blue-400/50',
        accentColor: 'text-blue-300',
        icon: '🌍',
      },
      NAM: {
        bgClass: 'bg-amber-500/5 border-amber-400/50',
        accentColor: 'text-amber-300',
        icon: '🌎',
      },
    };
    return configs[region] || {
      bgClass: 'bg-slate-500/5 border-slate-400/50',
      accentColor: 'text-slate-300',
      icon: '🌐',
    };
  };

  return (
    <div className="mb-6">
      {/* Single Grid - No Environment Grouping */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedStats.map((stat) => {
          const isSelected = selectedFilter?.environment === stat.environment && selectedFilter?.region === stat.region;
          const regionConfig = getRegionConfig(stat.region);

          return (
            <div
              key={`${stat.environment}-${stat.region}`}
              onClick={() => onCardClick(stat.environment, stat.region)}
              className={`
                rounded-xl border p-3 shadow-inner transition-all cursor-pointer hover:shadow-lg
                ${regionConfig.bgClass} hover:scale-[1.02]
                ${isSelected
                  ? "ring-2 ring-emerald-400/70 ring-offset-2 ring-offset-slate-950 shadow-lg shadow-emerald-400/20"
                  : ""
                }
              `}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onCardClick(stat.environment, stat.region);
                }
              }}
            >
              {/* Header with Environment Badge */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{regionConfig.icon}</span>
                  <div>
                    <div className={`font-semibold ${regionConfig.accentColor}`}>
                      {stat.region}
                    </div>
                    <div className="text-xs text-slate-400">
                      {stat.totalMachines} machine{stat.totalMachines !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                {/* Environment Badge in Top Right */}
                <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getEnvBadgeColor(stat.environment)}`}>
                  {envTypeLabels[stat.environment]}
                </span>
              </div>

              {/* Infrastructure Type Breakdown - Side by Side */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center justify-center rounded-lg bg-slate-800/50 p-1.5">
                  <svg className="h-4 w-4 text-emerald-400 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-slate-400">Linux</span>
                  <span className="text-base font-semibold text-slate-200">{stat.linuxCount}</span>
                </div>

                <div className="flex flex-col items-center justify-center rounded-lg bg-slate-800/50 p-1.5">
                  <svg className="h-4 w-4 text-sky-400 mb-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M0 3.45v6.55l10-1.27v-6.55l-10 1.27zm11 1.15v6.4l13-1.7v-6.4l-13 1.7zm-11 7.75v6.55l10 1.27v-6.55l-10-1.27zm11 1.15v6.4l13 1.7v-6.4l-13-1.7z" />
                  </svg>
                  <span className="text-xs text-slate-400">Windows</span>
                  <span className="text-base font-semibold text-slate-200">{stat.windowsCount}</span>
                </div>

                <div className="flex flex-col items-center justify-center rounded-lg bg-slate-800/50 p-1.5">
                  <svg className="h-4 w-4 text-violet-400 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="text-xs text-slate-400">ECS</span>
                  <span className="text-base font-semibold text-slate-200">{stat.ecsCount}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
