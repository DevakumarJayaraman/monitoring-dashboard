import { useCallback, useEffect, useMemo, useState } from "react";
import type { JSX } from "react";

import { Card } from "../Card";
import { ServiceStatusBadge } from "../shared/StatusIndicators";
import { ProfileSelector } from "./ProfileSelector";
import { ServicesSummary } from "./ServicesSummary";
import { ServiceStatusBreakdown } from "./ServiceStatusBreakdown";
import { ActionConfirmationModal, type ActionResult } from "./ActionConfirmationModal";
import { ServiceGlyph, profileLabels } from "../../features/infrastructure/config";
import {
  formatUptime,
  InfraDetails,
  ServicesInstances,
  serviceSummaryByName,
} from "../../features/infrastructure/data";
import type {
  NonAllProfile,
  ServiceProfileKey,
  ServicesInstance,
  ServiceStatus,
} from "../../types/infrastructure";

type ServiceCard = {
  name: string;
  summary: string;
  profile: ServiceProfileKey;
  instances: ServicesInstance[];
};

type ServiceVariant = {
  summary: string;
  instances: ServicesInstance[];
};

const normaliseStatus = (instance: ServicesInstance): ServiceStatus => {
  const raw = instance.status?.toLowerCase();
  if (raw === "degraded") return "degraded";
  if (raw === "restarting") return "restarting";
  if (raw === "stopped") return "degraded";
  if ((raw === "running" || raw === undefined) && instance.uptime <= 0) return "restarting";
  return "running";
};

export function ServicesView(): JSX.Element {
  const [activeProfiles, setActiveProfiles] = useState<ServiceProfileKey[]>(["all"]);
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});
  const [selectedInstances, setSelectedInstances] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    action: "start" | "stop";
    actionType: "all" | "selected";
    instances: ServicesInstance[];
    serviceNames: string[];
  }>({
    isOpen: false,
    action: "start",
    actionType: "all", 
    instances: [],
    serviceNames: []
  });

  const serviceSummaryMap = useMemo(
    () => new Map<string, string>(Object.entries(serviceSummaryByName)),
    []
  );

  const infraByMachine = useMemo(() => {
    const map = new Map<string, { datacenter: string }>();
    InfraDetails.forEach((detail) => {
      map.set(detail.machineName, { datacenter: detail.datacenter });
    });
    return map;
  }, []);

  const serviceVariantsByName = useMemo(() => {
    const map = new Map<string, Map<NonAllProfile, ServiceVariant>>();

    ServicesInstances.forEach((instance) => {
      if (instance.profile === "all") return;
      const profileKey = instance.profile as NonAllProfile;
      if (!map.has(instance.serviceName)) {
        map.set(instance.serviceName, new Map());
      }
      const profileMap = map.get(instance.serviceName)!;
      if (!profileMap.has(profileKey)) {
        profileMap.set(profileKey, {
          summary: serviceSummaryMap.get(instance.serviceName) ?? "",
          instances: [],
        });
      }
      profileMap.get(profileKey)!.instances.push(instance);
    });

    map.forEach((profileMap) => {
      profileMap.forEach((variant) => {
        variant.instances.sort((a, b) => a.id.localeCompare(b.id));
      });
    });

    return map;
  }, [serviceSummaryMap]);

  const servicesByProfile = useMemo(() => {
    const result = new Map<ServiceProfileKey, Map<string, ServiceVariant>>();
    serviceVariantsByName.forEach((profileMap, serviceName) => {
      profileMap.forEach((variant, profile) => {
        if (!result.has(profile)) {
          result.set(profile, new Map());
        }
        result.get(profile)!.set(serviceName, {
          summary: variant.summary,
          instances: [...variant.instances],
        });
      });
    });
    return result;
  }, [serviceVariantsByName]);

  const serviceStatsByName = useMemo(() => {
    const stats = new Map<string, Array<{ profileKey: NonAllProfile; running: number; total: number }>>();
    serviceVariantsByName.forEach((variants, serviceName) => {
      const perProfile: Array<{ profileKey: NonAllProfile; running: number; total: number }> = [];
      variants.forEach((variant, profileKey) => {
        const total = variant.instances.length;
        const running = variant.instances.filter(
          (instance) => normaliseStatus(instance) === "running"
        ).length;
        perProfile.push({ profileKey, running, total });
      });
      stats.set(serviceName, perProfile);
    });
    return stats;
  }, [serviceVariantsByName]);

  const servicesForActiveProfile = useMemo<ServiceCard[]>(() => {
    if (activeProfiles.length === 0) {
      return [];
    }

    if (activeProfiles.includes("all")) {
      // Show all services when "all" is selected
      const aggregate = new Map<string, { summary: string; instances: ServicesInstance[] }>();
      serviceVariantsByName.forEach((variants, serviceName) => {
        variants.forEach((variant) => {
          if (!aggregate.has(serviceName)) {
            aggregate.set(serviceName, {
              summary: variant.summary,
              instances: [],
            });
          }
          aggregate.get(serviceName)!.instances.push(...variant.instances);
        });
      });

      return Array.from(aggregate.entries())
        .map(([serviceName, data]) => ({
          name: serviceName,
          summary: data.summary,
          profile: "all" as ServiceProfileKey,
          instances: [...data.instances].sort((a, b) => a.id.localeCompare(b.id)),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    // Show services for selected specific profiles
    const aggregate = new Map<string, { summary: string; instances: ServicesInstance[]; profiles: Set<ServiceProfileKey> }>();
    
    activeProfiles.forEach(profile => {
      const profileMap = servicesByProfile.get(profile) ?? new Map();
      profileMap.forEach((variant, serviceName) => {
        if (!aggregate.has(serviceName)) {
          aggregate.set(serviceName, {
            summary: variant.summary,
            instances: [],
            profiles: new Set()
          });
        }
        const service = aggregate.get(serviceName)!;
        service.instances.push(...variant.instances);
        service.profiles.add(profile);
      });
    });

    return Array.from(aggregate.entries())
      .map(([serviceName, data]) => ({
        name: serviceName,
        summary: data.summary,
        profile: activeProfiles.length === 1 ? activeProfiles[0] : "all" as ServiceProfileKey,
        instances: [...data.instances].sort((a, b) => a.id.localeCompare(b.id)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeProfiles, serviceVariantsByName, servicesByProfile]);

  const filteredServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return servicesForActiveProfile;
    return servicesForActiveProfile.filter((service) =>
      service.name.toLowerCase().includes(query)
    );
  }, [searchQuery, servicesForActiveProfile]);

  const toggleServiceExpanded = (profile: ServiceProfileKey | "all", serviceName: string) => {
    const key = `${profile}-${serviceName}`;
    setExpandedServices((state) => {
      const isCurrentlyExpanded = state[key];
      
      if (isCurrentlyExpanded) {
        // If collapsing, just remove this service
        const newState = { ...state };
        delete newState[key];
        return newState;
      } else {
        // If expanding, collapse all others and expand only this one
        return { [key]: true };
      }
    });
  };

  const toggleInstanceSelected = (serviceKey: string, instanceId: string) => {
    setSelectedInstances((state) => {
      const current = state[serviceKey] ?? [];
      const next = current.includes(instanceId)
        ? current.filter((id) => id !== instanceId)
        : [...current, instanceId];
      return {
        ...state,
        [serviceKey]: next,
      };
    });
  };

  const clearSelection = (serviceKey: string) => {
    setSelectedInstances((state) => ({
      ...state,
      [serviceKey]: [],
    }));
  };

  useEffect(() => {
    setExpandedServices({});
  }, [activeProfiles]);

  const getServiceProfileStats = useCallback(
    (serviceName: string) => serviceStatsByName.get(serviceName) ?? [],
    [serviceStatsByName]
  );

  const getStatusCounts = useCallback((instances: ServicesInstance[]) => {
    return instances.reduce(
      (acc, instance) => {
        const status = normaliseStatus(instance);
        acc[status] += 1;
        return acc;
      },
      { running: 0, degraded: 0, restarting: 0 }
    );
  }, []);

  const getStatusBadgeClass = (running: number, total: number): string => {
    if (total === 0) return "text-slate-300 bg-slate-800 border border-slate-700";
    if (running === total) return "text-emerald-200 bg-emerald-500/10 border border-emerald-400/40";
    if (running === 0) return "text-rose-200 bg-rose-500/10 border border-rose-400/40";
    return "text-amber-200 bg-amber-500/10 border border-amber-400/40";
  };

  // Calculate global selection state
  const totalSelectedInstances = Object.values(selectedInstances).reduce(
    (total, instances) => total + instances.length, 
    0
  );

  const handleServiceSelectionAction = (serviceKey: string, action: "start" | "stop") => {
    const service = filteredServices.find(s => `${s.profile}-${s.name}` === serviceKey);
    if (!service) {
      return;
    }

    const instanceIds = selectedInstances[serviceKey] ?? [];
    const eligibleInstances = service.instances.filter(instance => {
      if (!instanceIds.includes(instance.id)) return false;
      const status = normaliseStatus(instance);
      return action === "start" ? status !== "running" : status === "running";
    });

    if (eligibleInstances.length === 0) {
      console.log(`No instances available to ${action} for service ${service.name}`);
      return;
    }

    setModalState({
      isOpen: true,
      action,
      actionType: "selected",
      instances: eligibleInstances,
      serviceNames: [service.name]
    });
  };

  const handleStartAll = () => {
    // Get all stopped instances in the current filtered view
    const instances = filteredServices.flatMap(service => 
      service.instances.filter(instance => normaliseStatus(instance) !== "running")
    );
    
    if (instances.length === 0) {
      console.log('No stopped instances to start');
      return;
    }
    
    const serviceNames = filteredServices.map(service => service.name);
    
    setModalState({
      isOpen: true,
      action: "start",
      actionType: "all",
      instances,
      serviceNames
    });
  };

  const handleStopAll = () => {
    // Get all running instances in the current filtered view
    const instances = filteredServices.flatMap(service => 
      service.instances.filter(instance => normaliseStatus(instance) === "running")
    );
    
    if (instances.length === 0) {
      console.log('No running instances to stop');
      return;
    }
    
    const serviceNames = filteredServices.map(service => service.name);
    
    setModalState({
      isOpen: true,
      action: "stop", 
      actionType: "all",
      instances,
      serviceNames
    });
  };

  const handleModalClose = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleModalConfirm = async (): Promise<ActionResult[]> => {
    // Validate that we have instances to process
    if (modalState.instances.length === 0) {
      return [];
    }

    // Simulate API calls with realistic delays and some failures
    const results: ActionResult[] = [];
    
    for (const instance of modalState.instances) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
      
      // Simulate 90% success rate
      const success = Math.random() > 0.1;
      const serviceName = modalState.serviceNames.find(name => instance.id.includes(name)) || 'Unknown Service';
      
      results.push({
        instanceId: instance.id,
        serviceName,
        success,
        message: success 
          ? `${modalState.action === 'start' ? 'Started' : 'Stopped'} successfully`
          : `Failed to ${modalState.action}: Service unavailable`
      });
    }
    
    // Clear selections after successful action
    if (modalState.actionType === 'selected') {
      setSelectedInstances({});
    }
    
    return results;
  };

  // Calculate stats for all visible services
  const totalVisibleInstances = filteredServices.reduce((total, service) => total + service.instances.length, 0);
  const runningVisibleInstances = filteredServices.reduce((total, service) => {
    return total + service.instances.filter(instance => normaliseStatus(instance) === "running").length;
  }, 0);
  const stoppedVisibleInstances = totalVisibleInstances - runningVisibleInstances;

  const resultsLabel = `${filteredServices.length} of ${servicesForActiveProfile.length}`;

  return (
    <div className="space-y-6">
      {/* Services Summary by Profile */}
      <ServicesSummary 
        servicesInstances={ServicesInstances}
        activeProfiles={activeProfiles}
        onProfileClick={(profile) => {
          if (profile === "all") {
            setActiveProfiles(["all"]);
          } else {
            // Toggle profile selection
            if (activeProfiles.includes(profile)) {
              const newProfiles = activeProfiles.filter(p => p !== profile);
              setActiveProfiles(newProfiles.length === 0 ? ["all"] : newProfiles);
            } else {
              const newProfiles = activeProfiles.filter(p => p !== "all").concat(profile);
              setActiveProfiles(newProfiles);
            }
          }
        }}
      />
      
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <ProfileSelector value={activeProfiles} onChange={setActiveProfiles} />
        <span className="text-xs text-slate-500 md:text-right">
          Showing {resultsLabel}
        </span>
      </div>
      
      {/* Search Services */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="flex flex-col gap-2 text-sm text-slate-300 sm:w-80">
            <span className="font-medium text-slate-200">Search services</span>
            <input
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-inner placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              type="search"
              name="service-search"
              placeholder="Search by service name"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
          <div className="flex items-center gap-2">
            {/* Start/Stop All Services Buttons */}
            <div className="flex items-center gap-2 border-r border-slate-700 pr-3">
              <button
                type="button"
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  stoppedVisibleInstances > 0
                    ? "border-emerald-400/50 text-emerald-200 hover:bg-emerald-400/10"
                    : "border-slate-700 text-slate-400 cursor-not-allowed"
                }`}
                onClick={handleStartAll}
                disabled={stoppedVisibleInstances === 0}
                title={`Start all ${stoppedVisibleInstances} stopped services`}
              >
                ▶ Start All ({stoppedVisibleInstances})
              </button>
              <button
                type="button"
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  runningVisibleInstances > 0
                    ? "border-rose-400/50 text-rose-200 hover:bg-rose-400/10"
                    : "border-slate-700 text-slate-400 cursor-not-allowed"
                }`}
                onClick={handleStopAll}
                disabled={runningVisibleInstances === 0}
                title={`Stop all ${runningVisibleInstances} running services`}
              >
                ■ Stop All ({runningVisibleInstances})
              </button>
            </div>
            {totalSelectedInstances > 0 && (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                onClick={() => setSelectedInstances({})}
              >
                Reset Selection ({totalSelectedInstances})
              </button>
            )}
          </div>
        </div>

        <ServiceStatusBreakdown 
          servicesInstances={ServicesInstances}
          activeProfiles={activeProfiles}
        />
      </div>
      <div className="space-y-6">
        {filteredServices.map((service) => {
          const serviceKey = `${service.profile}-${service.name}`;
          const isExpanded = Boolean(expandedServices[serviceKey]);
          const statusCounts = getStatusCounts(service.instances);
          const totalInstances = service.instances.length;
          const perProfileStats = getServiceProfileStats(service.name);
          const profileStat =
            service.profile !== "all"
              ? perProfileStats.find((stat) => stat.profileKey === (service.profile as NonAllProfile))
              : undefined;
          const selection = selectedInstances[serviceKey] ?? [];
          const hasSelection = selection.length > 0;
          const selectedInstanceDetails = service.instances.filter(instance => selection.includes(instance.id));
          const startableSelectedCount = selectedInstanceDetails.filter(instance => normaliseStatus(instance) !== "running").length;
          const stoppableSelectedCount = selectedInstanceDetails.filter(instance => normaliseStatus(instance) === "running").length;

          return (
            <Card
              key={serviceKey}
              title={service.name}
              icon={<ServiceGlyph />}
              iconWrapperClassName={isExpanded ? "text-emerald-200" : "text-emerald-300"}
              className={`${
                isExpanded 
                  ? "border-emerald-400/70 bg-emerald-950/30 shadow-lg shadow-emerald-400/10 ring-1 ring-emerald-400/20" 
                  : "border-slate-800 bg-slate-900/70 hover:border-emerald-300/60"
              } transition-all duration-200`}
              contentClassName="space-y-6 text-slate-200"
              topRightAction={
                <button
                  type="button"
                  className={`inline-flex items-center gap-1 transition ${
                    isExpanded 
                      ? "text-emerald-200 hover:text-emerald-100 font-medium" 
                      : "text-emerald-300 hover:text-emerald-200"
                  }`}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleServiceExpanded(service.profile, service.name);
                  }}
                >
                  {isExpanded ? "Collapse" : "Expand"}
                  <span aria-hidden>{isExpanded ? "–" : "+"}</span>
                </button>
              }
              footer={
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className={hasSelection ? "text-emerald-300" : "text-slate-500"}>
                    {hasSelection
                      ? `${selection.length} instance${selection.length !== 1 ? "s" : ""} selected`
                      : isExpanded ? "No instances selected" : "Expand to view instances"}
                  </span>
                  {isExpanded ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          startableSelectedCount > 0
                            ? "border-emerald-400/50 text-emerald-200 hover:bg-emerald-400/10"
                            : "border-slate-700 text-slate-500 cursor-not-allowed"
                        }`}
                        disabled={startableSelectedCount === 0}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleServiceSelectionAction(serviceKey, "start");
                        }}
                      >
                        ▶ Start Selected ({startableSelectedCount})
                      </button>
                      <button
                        type="button"
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          stoppableSelectedCount > 0
                            ? "border-rose-400/50 text-rose-200 hover:bg-rose-400/10"
                            : "border-slate-700 text-slate-500 cursor-not-allowed"
                        }`}
                        disabled={stoppableSelectedCount === 0}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleServiceSelectionAction(serviceKey, "stop");
                        }}
                      >
                        ■ Stop Selected ({stoppableSelectedCount})
                      </button>
                      {hasSelection ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5 text-slate-300 transition hover:bg-slate-800"
                          onClick={(event) => {
                            event.stopPropagation();
                            clearSelection(serviceKey);
                          }}
                        >
                          Clear
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              }
            >
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-sm leading-relaxed text-slate-200">{service.summary}</p>
                  {service.profile === "all" ? (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {perProfileStats.map(({ profileKey, running, total }) => (
                        <span
                          key={profileKey}
                          className={`rounded-full px-3 py-1 border ${getStatusBadgeClass(running, total)}`}
                        >
                          {profileLabels[profileKey]} {running}/{total}
                        </span>
                      ))}
                      <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-200">
                        Total {statusCounts.running}/{totalInstances}
                      </span>
                    </div>
                  ) : profileStat ? (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-200">
                        {profileLabels[service.profile]}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 border ${getStatusBadgeClass(
                          profileStat.running,
                          profileStat.total
                        )}`}
                      >
                        {profileStat.running}/{profileStat.total} running
                      </span>
                    </div>
                  ) : null}
                </div>

                {isExpanded ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Instances</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {service.instances.map((instance) => {
                        const machineMeta = infraByMachine.get(instance.machineName);
                        const status = normaliseStatus(instance);
                        const isSelected = selection.includes(instance.id);
                        return (
                          <div
                          key={instance.id}
                          className={`group rounded-lg border bg-slate-900/60 px-3 py-3 transition ${
                            isSelected
                              ? "border-emerald-400/60 ring-1 ring-emerald-400/30"
                              : "border-slate-800 hover:border-emerald-300/40"
                          }`}
                          role="checkbox"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleInstanceSelected(serviceKey, instance.id);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === " " || event.key === "Enter") {
                              event.preventDefault();
                              toggleInstanceSelected(serviceKey, instance.id);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                                <span className="rounded-full border border-emerald-400/60 bg-emerald-500/10 px-2 py-0.5 text-emerald-200">
                                  {profileLabels[instance.profile]}
                                </span>
                                <span className="rounded-full border border-slate-600 bg-slate-800/70 px-2 py-0.5 text-slate-200">
                                  v{instance.version}
                                </span>
                              </div>
                              <div className="text-sm font-medium text-slate-100">
                                {instance.machineName}
                              </div>
                              <div className="text-xs text-slate-500">
                                Port {instance.Port} · {machineMeta?.datacenter ?? "—"}
                              </div>
                            </div>
                            <ServiceStatusBadge status={status} />
                          </div>
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                            <code className="text-slate-500">{instance.id}</code>
                            <span>Uptime {formatUptime(instance.uptime)}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-emerald-300">
                            <a
                              className="inline-flex items-center gap-1 transition hover:text-emerald-200"
                              href={instance.logURL}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(event) => event.stopPropagation()}
                            >
                              Logs ↗
                            </a>
                            <a
                              className="inline-flex items-center gap-1 transition hover:text-emerald-200"
                              href={instance.metricsURL}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(event) => event.stopPropagation()}
                            >
                              Metrics ↗
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  </div>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
      
      <ActionConfirmationModal
        isOpen={modalState.isOpen}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        action={modalState.action}
        actionType={modalState.actionType}
        instances={modalState.instances}
        serviceNames={modalState.serviceNames}
      />
    </div>
  );
}
