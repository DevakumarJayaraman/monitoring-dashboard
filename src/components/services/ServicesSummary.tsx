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

      // Also add to "all" category
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

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-slate-200 mb-4">Services Overview by Profile</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.profile}
            onClick={() => onProfileClick(stat.profile)}
            className={`
              p-4 rounded-lg border cursor-pointer transition-all duration-200
              ${activeProfiles.includes(stat.profile)
                ? "border-blue-400/70 bg-blue-500/10 shadow-lg shadow-blue-400/20"
                : "border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800/70"
              }
            `}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-slate-200 text-sm">
                {stat.profileLabel}
              </h3>
              <div className={`
                px-2 py-1 rounded text-xs font-medium
                ${stat.healthPercentage >= 90 
                  ? "bg-green-500/20 text-green-300" 
                  : stat.healthPercentage >= 70 
                    ? "bg-yellow-500/20 text-yellow-300"
                    : "bg-red-500/20 text-red-300"
                }
              `}>
                {stat.healthPercentage}%
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md border border-slate-700 bg-slate-900/40 px-3 py-2">
                  <span className="block text-xs uppercase tracking-wide text-slate-500">Services</span>
                  <span className="text-lg font-semibold text-slate-100">{stat.totalServices}</span>
                </div>
                <div className="rounded-md border border-slate-700 bg-slate-900/40 px-3 py-2">
                  <span className="block text-xs uppercase tracking-wide text-slate-500">Instances</span>
                  <span className="text-lg font-semibold text-slate-100">{stat.totalInstances}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 font-medium text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  Running {stat.runningInstances}
                </span>
                {stat.degradedInstances > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 font-medium text-rose-200">
                    <span className="h-2 w-2 rounded-full bg-rose-300" />
                    Degraded {stat.degradedInstances}
                  </span>
                )}
                {stat.restartingInstances > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 font-medium text-amber-200">
                    <span className="h-2 w-2 rounded-full bg-amber-300" />
                    Restarting {stat.restartingInstances}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
