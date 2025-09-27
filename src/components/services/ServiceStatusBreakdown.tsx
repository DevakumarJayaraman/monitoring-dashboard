import type { JSX } from "react";
import type { ServicesInstance, ServiceProfileKey } from "../../types/infrastructure";

interface ServiceStatusBreakdownProps {
  servicesInstances: ServicesInstance[];
  activeProfiles: ServiceProfileKey[];
}

const normaliseStatus = (instance: ServicesInstance): "running" | "degraded" | "restarting" => {
  const raw = instance.status?.toLowerCase();
  if (raw === "degraded") return "degraded";
  if (raw === "restarting") return "restarting";
  if (raw === "stopped") return "degraded";
  if ((raw === "running" || raw === undefined) && instance.uptime <= 0) return "restarting";
  return "running";
};

export function ServiceStatusBreakdown({ 
  servicesInstances, 
  activeProfiles 
}: ServiceStatusBreakdownProps): JSX.Element {
  
  const getFilteredInstances = () => {
    if (activeProfiles.includes("all")) {
      return servicesInstances;
    }
    return servicesInstances.filter(instance => 
      activeProfiles.includes(instance.profile)
    );
  };

  const filteredInstances = getFilteredInstances();
  
  const statusCounts = {
    running: filteredInstances.filter(i => normaliseStatus(i) === "running").length,
    degraded: filteredInstances.filter(i => normaliseStatus(i) === "degraded").length,
    restarting: filteredInstances.filter(i => normaliseStatus(i) === "restarting").length,
  };

  const totalInstances = filteredInstances.length;
  const uniqueServices = new Set(filteredInstances.map(i => i.serviceName)).size;

  const getStatusPercentage = (count: number) => 
    totalInstances > 0 ? Math.round((count / totalInstances) * 100) : 0;

  if (totalInstances === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-6">
        <h3 className="text-lg font-medium text-slate-200 mb-2">Service Status Overview</h3>
        <p className="text-slate-400">No services found for the selected profile(s).</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
      <h3 className="text-base font-medium text-slate-200 mb-3">Service Status Overview</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center">
          <div className="text-xl font-bold text-slate-200">{uniqueServices}</div>
          <div className="text-xs text-slate-400">Services</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-slate-200">{totalInstances}</div>
          <div className="text-xs text-slate-400">Instances</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-green-400">{statusCounts.running}</div>
          <div className="text-xs text-slate-400">Running</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-red-400">{statusCounts.degraded + statusCounts.restarting}</div>
          <div className="text-xs text-slate-400">Issues</div>
        </div>
      </div>

      {/* Compact status breakdown */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              <span className="text-sm font-medium text-emerald-200">Running</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-emerald-100">
              <span>{statusCounts.running}</span>
              <span className="text-xs font-medium text-emerald-200/80">
                {getStatusPercentage(statusCounts.running)}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-rose-400/20 bg-rose-400/5 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
              <span className="text-sm font-medium text-rose-200">Issues</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold text-rose-100">
              <span>{statusCounts.degraded + statusCounts.restarting}</span>
              <span className="text-xs font-medium text-rose-200/80">
                {getStatusPercentage(statusCounts.degraded + statusCounts.restarting)}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {statusCounts.degraded > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/40 bg-rose-500/10 px-3 py-1 font-medium text-rose-200">
              <span className="h-2 w-2 rounded-full bg-rose-300" />
              Degraded {statusCounts.degraded} ({getStatusPercentage(statusCounts.degraded)}%)
            </span>
          )}
          {statusCounts.restarting > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 font-medium text-amber-200">
              <span className="h-2 w-2 rounded-full bg-amber-300" />
              Restarting {statusCounts.restarting} ({getStatusPercentage(statusCounts.restarting)}%)
            </span>
          )}
          {statusCounts.degraded === 0 && statusCounts.restarting === 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/5 px-3 py-1 text-emerald-200">
              All running smoothly
            </span>
          )}
        </div>
      </div>

      {/* Overall health indicator */}
      <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2">
        <div className="text-xs text-slate-300">Overall Health</div>
        <div
          className={`text-sm font-semibold ${
            getStatusPercentage(statusCounts.running) >= 95
              ? "text-emerald-300"
              : getStatusPercentage(statusCounts.running) >= 80
                ? "text-amber-300"
                : "text-rose-300"
          }`}
        >
          {getStatusPercentage(statusCounts.running)}%
        </div>
      </div>
    </div>
  );
}
