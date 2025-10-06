import type { JSX } from "react";
import type { 
  ServicesInstance, 
  ServiceProfileKey, 
  ServiceStatus
} from "../../types/infrastructure";

type EnvironmentFilter = 'ALL' | 'DEV' | 'STAGING' | 'PROD_COB';

export type { EnvironmentFilter };

type ServiceSummaryStats = {
  profile: ServiceProfileKey;
  envType: string; // DEV, STAGING, PROD, COB
  totalServices: number;
  totalInstances: number;
  runningInstances: number;
  degradedInstances: number;
  restartingInstances: number;
  healthPercentage: number;
};

interface ServicesSummaryProps {
  servicesInstances: ServicesInstance[];
  activeProfiles: ServiceProfileKey[];
  onProfileClick: (profile: ServiceProfileKey) => void;
  environmentFilter: EnvironmentFilter;
  onEnvironmentFilterChange: (filter: EnvironmentFilter) => void;
}

const normaliseStatus = (instance: ServicesInstance): ServiceStatus => {
  const raw = instance.status?.toLowerCase();
  if (raw === "degraded") return "degraded";
  if (raw === "restarting") return "restarting";
  if (raw === "stopped") return "degraded";
  if ((raw === "running" || raw === undefined) && instance.uptime <= 0) return "restarting";
  return "running";
};

export function ServicesSummary({ 
  servicesInstances, 
  activeProfiles, 
  onProfileClick,
  environmentFilter,
  onEnvironmentFilterChange
}: ServicesSummaryProps): JSX.Element {
  
  const summaryStats = (): ServiceSummaryStats[] => {
    const profileStats = new Map<ServiceProfileKey, {
      services: Set<string>;
      instances: ServicesInstance[];
      envType: string;
    }>();

    // Group instances by profile
    servicesInstances.forEach(instance => {
      if (instance.profile === "all") return;
      
      const profile = instance.profile;
      if (!profileStats.has(profile)) {
        profileStats.set(profile, { 
          services: new Set(), 
          instances: [],
          envType: instance.envType || 'STAGING'
        });
      }
      
      const stats = profileStats.get(profile)!;
      stats.services.add(instance.serviceName);
      stats.instances.push(instance);
      // Set envType from first instance
      if (instance.envType) {
        stats.envType = instance.envType;
      }

      // Also add to "all" category
      if (!profileStats.has("all")) {
        profileStats.set("all", {
          services: new Set(),
          instances: [],
          envType: 'ALL'
        });
      }
      const allStats = profileStats.get("all")!;
      allStats.services.add(instance.serviceName);
      allStats.instances.push(instance);
    });

    // Convert to summary stats
    return Array.from(profileStats.entries())
      .filter(([, stats]) => stats.instances.length > 0)
      .map(([profile, stats]): ServiceSummaryStats => {
        const runningInstances = stats.instances.filter(i => normaliseStatus(i) === "running").length;
        const degradedInstances = stats.instances.filter(i => normaliseStatus(i) === "degraded").length;
        const restartingInstances = stats.instances.filter(i => normaliseStatus(i) === "restarting").length;
        
        return {
          profile,
          envType: stats.envType,
          totalServices: stats.services.size,
          totalInstances: stats.instances.length,
          runningInstances,
          degradedInstances,
          restartingInstances,
          healthPercentage: stats.instances.length > 0 ? Math.round((runningInstances / stats.instances.length) * 100) : 0
        };
      })
      .sort((a, b) => {
        // "all" first, then by envType (DEV, STAGING, PROD, COB), then alphabetical within each group
        if (a.profile === "all") return -1;
        if (b.profile === "all") return 1;
        
        // Order by environment type
        const envOrder: Record<string, number> = { 'DEV': 1, 'STAGING': 2, 'PROD': 3, 'COB': 4 };
        const envCompare = (envOrder[a.envType] || 99) - (envOrder[b.envType] || 99);
        if (envCompare !== 0) return envCompare;
        
        // Then alphabetical by profile code within same environment
        return a.profile.localeCompare(b.profile);
      });
  };

  const stats = summaryStats();
  
  // Filter out 'all' profile from display but keep specific profiles
  const displayStats = stats.filter(stat => stat.profile !== 'all');
  
  // Apply environment filter
  const filteredStats = environmentFilter === 'ALL' 
    ? displayStats 
    : environmentFilter === 'PROD_COB'
    ? displayStats.filter(stat => stat.envType === 'PROD' || stat.envType === 'COB')
    : displayStats.filter(stat => stat.envType === environmentFilter);
  
  // Group stats by environment type for UI display
  const groupedStats = filteredStats.reduce((acc, stat) => {
    const envType = stat.envType;
    if (!acc[envType]) {
      acc[envType] = [];
    }
    acc[envType].push(stat);
    return acc;
  }, {} as Record<string, ServiceSummaryStats[]>);
  
  const envTypeLabels: Record<string, string> = {
    'DEV': 'Development',
    'STAGING': 'Staging / UAT',
    'PROD': 'Production',
    'COB': 'Disaster Recovery (COB)'
  };
  
  const envOrder = ['DEV', 'STAGING', 'PROD', 'COB'];

  const getHealthColor = (percentage: number): string => {
    if (percentage >= 90) return "text-green-400";
    if (percentage >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getProfileConfig = (profile: ServiceProfileKey) => {
    // Define colors for different profile types
    const configs: Record<string, { bgClass: string; accentColor: string }> = {
      all: {
        bgClass: 'bg-violet-500/5 border-violet-400/50',
        accentColor: 'text-violet-300'
      },
      apacqa: {
        bgClass: 'bg-emerald-500/5 border-emerald-400/50',
        accentColor: 'text-emerald-300'
      },
      apacuat: {
        bgClass: 'bg-blue-500/5 border-blue-400/50',
        accentColor: 'text-blue-300'
      },
      apacprod: {
        bgClass: 'bg-amber-500/5 border-amber-400/50',
        accentColor: 'text-amber-300'
      },
      dev: {
        bgClass: 'bg-slate-500/5 border-slate-400/50',
        accentColor: 'text-slate-300'
      }
    };
    return configs[profile] || configs.all;
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-200">Services Overview by Profile</h2>
        
        {/* Environment Filter Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="env-filter" className="text-sm text-slate-400">
            Filter by Environment:
          </label>
          <select
            id="env-filter"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            value={environmentFilter}
            onChange={(e) => onEnvironmentFilterChange(e.target.value as EnvironmentFilter)}
          >
            <option value="ALL">All Environments</option>
            <option value="DEV">Development</option>
            <option value="STAGING">Staging / UAT</option>
            <option value="PROD_COB">Production / COB</option>
          </select>
        </div>
      </div>
      
      {/* Render grouped by environment type */}
      {envOrder.map(envType => {
        const envStats = groupedStats[envType];
        if (!envStats || envStats.length === 0) return null;
        
        return (
          <div key={envType} className="mb-6">
            {/* Environment Type Header */}
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              {envTypeLabels[envType]}
              <span className="text-xs font-normal text-slate-500">({envStats.length} profile{envStats.length !== 1 ? 's' : ''})</span>
            </h3>
            
            {/* Profile Cards Grid */}
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {envStats.map((stat) => {
                const isSelected = activeProfiles.includes(stat.profile);
                const profileConfig = getProfileConfig(stat.profile);
                
                return (
                  <div
                    key={stat.profile}
                    onClick={() => onProfileClick(stat.profile)}
                    className={`
                      rounded-xl border p-4 shadow-inner transition-all cursor-pointer hover:shadow-lg
                      ${profileConfig.bgClass} hover:scale-[1.02]
                      ${isSelected 
                        ? "ring-2 ring-emerald-400/70 ring-offset-2 ring-offset-slate-950 shadow-lg shadow-emerald-400/20" 
                        : ""
                      }
                    `}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-slate-100">
                          {stat.profile}
                        </h4>
                        <span className={`text-xs font-medium ${getHealthColor(stat.healthPercentage)}`}>
                          {stat.healthPercentage}%
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {stat.totalServices} services • {stat.totalInstances} instances
                      </div>
                    </div>
                    
                    <div className="grid gap-4 grid-cols-3">
                      <div className="text-center">
                        <div className="text-sm font-semibold text-emerald-300">
                          {stat.runningInstances}
                        </div>
                        <div className="text-[10px] text-slate-400">Running</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm font-semibold text-rose-300">
                          {stat.degradedInstances}
                        </div>
                        <div className="text-[10px] text-slate-400">Degraded</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm font-semibold text-amber-300">
                          {stat.restartingInstances}
                        </div>
                        <div className="text-[10px] text-slate-400">Restarting</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
