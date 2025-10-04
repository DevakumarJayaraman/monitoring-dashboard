import type { JSX } from "react";
import type { 
  ServicesInstance, 
  ServiceProfileKey, 
  ServiceStatus
} from "../../types/infrastructure";
import { profileLabels } from "../../features/infrastructure/config";

type ServiceSummaryStats = {
  profile: ServiceProfileKey;
  profileLabel: string;
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
  onProfileClick 
}: ServicesSummaryProps): JSX.Element {
  
  const summaryStats = (): ServiceSummaryStats[] => {
    const profileStats = new Map<ServiceProfileKey, {
      services: Set<string>;
      instances: ServicesInstance[];
    }>();

    // Initialize all profiles
    Object.keys(profileLabels).forEach(profile => {
      profileStats.set(profile as ServiceProfileKey, {
        services: new Set(),
        instances: []
      });
    });

    // Group instances by profile
    servicesInstances.forEach(instance => {
      if (instance.profile === "all") return;
      
      const profile = instance.profile;
      if (!profileStats.has(profile)) {
        profileStats.set(profile, { services: new Set(), instances: [] });
      }
      
      const stats = profileStats.get(profile)!;
      stats.services.add(instance.serviceName);
      stats.instances.push(instance);

      // Also add to "all" category - this ensures distinct service names and total instance count across all profiles
      const allStats = profileStats.get("all")!;
      allStats.services.add(instance.serviceName); // Set automatically handles distinct service names
      allStats.instances.push(instance); // All instances counted
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
          profileLabel: profileLabels[profile],
          totalServices: stats.services.size,
          totalInstances: stats.instances.length,
          runningInstances,
          degradedInstances,
          restartingInstances,
          healthPercentage: stats.instances.length > 0 ? Math.round((runningInstances / stats.instances.length) * 100) : 0
        };
      })
      .sort((a, b) => {
        // "all" first, then alphabetical
        if (a.profile === "all") return -1;
        if (b.profile === "all") return 1;
        return a.profileLabel.localeCompare(b.profileLabel);
      });
  };

  const stats = summaryStats();

  const getHealthColor = (percentage: number): string => {
    if (percentage >= 90) return "text-green-400";
    if (percentage >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getProfileConfig = (profile: ServiceProfileKey) => {
    // Define colors for different profile types similar to infra cards
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
      usqa: {
        bgClass: 'bg-cyan-500/5 border-cyan-400/50',
        accentColor: 'text-cyan-300'
      },
      usuat: {
        bgClass: 'bg-indigo-500/5 border-indigo-400/50',
        accentColor: 'text-indigo-300'
      },
      usprod: {
        bgClass: 'bg-rose-500/5 border-rose-400/50',
        accentColor: 'text-rose-300'
      },
      euqa: {
        bgClass: 'bg-teal-500/5 border-teal-400/50',
        accentColor: 'text-teal-300'
      },
      euuat: {
        bgClass: 'bg-sky-500/5 border-sky-400/50',
        accentColor: 'text-sky-300'
      },
      euprod: {
        bgClass: 'bg-orange-500/5 border-orange-400/50',
        accentColor: 'text-orange-300'
      }
    };
    return configs[profile] || configs.all;
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-slate-200 mb-4">Services Overview by Profile</h2>
      
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
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
                    {stat.profileLabel}
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
}
