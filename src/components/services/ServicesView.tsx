import { useCallback, useEffect, useMemo, useState } from "react";
import type { JSX } from "react";

import { Card } from "../Card";
import { ServiceStatusBadge } from "../shared/StatusIndicators";
import { ProfileSelector } from "./ProfileSelector";
import { ServicesSummary } from "./ServicesSummary";
import { ActionConfirmationModal, type ActionResult } from "./ActionConfirmationModal";
import { ServiceGlyph, profileLabels } from "../../features/infrastructure/config";
import {
  formatUptime,
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
  const [activeProfiles, setActiveProfiles] = useState<ServiceProfileKey[]>([]);
  const [selectedInstances, setSelectedInstances] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServiceKey, setSelectedServiceKey] = useState<string | null>(null);
  
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
    
    // Filter out "all" from activeProfiles if it's mixed with other profiles
    const specificProfiles = activeProfiles.filter(p => p !== "all");
    
    specificProfiles.forEach(profile => {
      const servicesInProfile = servicesByProfile.get(profile);
      if (!servicesInProfile) return;
      
      servicesInProfile.forEach((variant, serviceName) => {
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
        profile: specificProfiles.length === 1 ? specificProfiles[0] : "all" as ServiceProfileKey,
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
    setSelectedServiceKey(key === selectedServiceKey ? null : key);
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
    setSelectedServiceKey(null);
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
  
  const selectedService = selectedServiceKey 
    ? filteredServices.find(s => `${s.profile}-${s.name}` === selectedServiceKey)
    : null;

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
      </div>
      
      {/* Search Services - Only visible when profile selected */}
      {activeProfiles.length > 0 && (
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
          </div>
        </div>

      </div>
      )}
      
      {/* Split Screen Layout */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Left Side - Service Cards */}
        <div className="space-y-6">
          {activeProfiles.length > 0 ? (
            filteredServices.map((service) => {
          const serviceKey = `${service.profile}-${service.name}`;
          const isSelected = selectedServiceKey === serviceKey;
          const statusCounts = getStatusCounts(service.instances);
          const totalInstances = service.instances.length;
          const perProfileStats = getServiceProfileStats(service.name);
          const profileStat =
            service.profile !== "all"
              ? perProfileStats.find((stat) => stat.profileKey === (service.profile as NonAllProfile))
              : undefined;

          return (
            <Card
              key={serviceKey}
              title={service.name}
              icon={<ServiceGlyph />}
              iconWrapperClassName={isSelected ? "text-emerald-200" : "text-emerald-300"}
              className={`${
                isSelected 
                  ? "border-emerald-400/70 bg-emerald-950/30 shadow-lg shadow-emerald-400/10 ring-1 ring-emerald-400/20" 
                  : "border-slate-800 bg-slate-900/70 hover:border-emerald-300/60 cursor-pointer"
              } transition-all duration-200`}
              contentClassName="space-y-3 text-slate-200"
              onClick={() => toggleServiceExpanded(service.profile, service.name)}
            >
              <div className="space-y-3">
                <div className="space-y-2">
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
              </div>
            </Card>
          );
        })
          ) : (
            <Card
              title="Services"
              icon={<ServiceGlyph />}
              iconWrapperClassName="text-slate-400"
              className="border-slate-700 bg-slate-900/50"
              contentClassName="space-y-6 text-slate-200"
            >
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 rounded-full bg-slate-800/50 p-6">
                  <ServiceGlyph />
                </div>
                <h3 className="text-lg font-semibold text-slate-300 mb-2">
                  No Profile Selected
                </h3>
                <p className="text-sm text-slate-400 max-w-md">
                  Select any profile summary card to view services.
                </p>
              </div>
            </Card>
          )}
        </div>
        
        {/* Right Side - Instance Details */}
        <div className="space-y-6">
          {selectedService ? (
            <Card
              title={`${selectedService.name} - Instance Details`}
              icon={<ServiceGlyph />}
              iconWrapperClassName="text-emerald-200"
              className="border-emerald-400/70 bg-emerald-950/30 shadow-lg shadow-emerald-400/10"
              contentClassName="space-y-4 text-slate-200"
              topRightAction={
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-emerald-200 hover:text-emerald-100 transition font-medium"
                  onClick={() => setSelectedServiceKey(null)}
                >
                  Close
                  <span aria-hidden>×</span>
                </button>
              }
            >
              <div className="flex flex-wrap items-center gap-2 text-xs mb-4">
                {selectedService.profile !== "all" && (
                  <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-200">
                    {profileLabels[selectedService.profile]}
                  </span>
                )}
                <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-200">
                  Total {getStatusCounts(selectedService.instances).running}/{selectedService.instances.length}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 mb-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Instances ({selectedService.instances.length})
                </h4>
                {(() => {
                      const selection = selectedInstances[selectedServiceKey!] ?? [];
                      const hasSelection = selection.length > 0;
                      const selectedInstanceDetails = selectedService.instances.filter(instance => selection.includes(instance.id));
                      const startableSelectedCount = selectedInstanceDetails.filter(instance => normaliseStatus(instance) !== "running").length;
                      const stoppableSelectedCount = selectedInstanceDetails.filter(instance => normaliseStatus(instance) === "running").length;
                      
                      return hasSelection ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition ${
                              startableSelectedCount > 0
                                ? "border-emerald-400/50 text-emerald-200 hover:bg-emerald-400/10"
                                : "border-slate-700 text-slate-500 cursor-not-allowed"
                            }`}
                            disabled={startableSelectedCount === 0}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleServiceSelectionAction(selectedServiceKey!, "start");
                            }}
                          >
                            ▶ Start ({startableSelectedCount})
                          </button>
                          <button
                            type="button"
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition ${
                              stoppableSelectedCount > 0
                                ? "border-rose-400/50 text-rose-200 hover:bg-rose-400/10"
                                : "border-slate-700 text-slate-500 cursor-not-allowed"
                            }`}
                            disabled={stoppableSelectedCount === 0}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleServiceSelectionAction(selectedServiceKey!, "stop");
                            }}
                          >
                            ■ Stop ({stoppableSelectedCount})
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-800"
                            onClick={(event) => {
                              event.stopPropagation();
                              clearSelection(selectedServiceKey!);
                            }}
                          >
                            Clear
                          </button>
                        </div>
                      ) : null;
                    })()}
                  </div>
                  
                  <div className="space-y-4">
                    {(() => {
                      // Group instances by profile
                      const instancesByProfile = new Map<string, ServicesInstance[]>();
                      selectedService.instances.forEach((instance) => {
                        const profile = instance.profile;
                        if (!instancesByProfile.has(profile)) {
                          instancesByProfile.set(profile, []);
                        }
                        instancesByProfile.get(profile)!.push(instance);
                      });
                      
                      // Sort profiles: "all" first, then alphabetically
                      const sortedProfiles = Array.from(instancesByProfile.keys()).sort((a, b) => {
                        if (a === "all") return -1;
                        if (b === "all") return 1;
                        return profileLabels[a].localeCompare(profileLabels[b]);
                      });
                      
                      return sortedProfiles.map((profile) => {
                        const instances = instancesByProfile.get(profile)!;
                        const profileStats = getStatusCounts(instances);
                        
                        return (
                          <div key={profile} className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
                            {/* Profile Header */}
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/50">
                              <div className="flex items-center gap-2">
                                <span className="rounded-full border border-emerald-400/60 bg-emerald-500/10 px-3 py-1 text-emerald-200 text-xs font-medium">
                                  {profileLabels[profile]}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {instances.length} {instances.length === 1 ? 'instance' : 'instances'}
                                </span>
                              </div>
                              <span className="text-xs text-slate-400">
                                Running {profileStats.running}/{instances.length}
                              </span>
                            </div>
                            
                            {/* Instances in this profile */}
                            <div className="space-y-2">
                              {instances.map((instance) => {
                                const status = normaliseStatus(instance);
                                const selection = selectedInstances[selectedServiceKey!] ?? [];
                                const isInstanceSelected = selection.includes(instance.id);
                                
                                return (
                                  <div
                                    key={instance.id}
                                    className={`group rounded-lg border bg-slate-900/60 px-3 py-2 transition cursor-pointer ${
                                      isInstanceSelected
                                        ? "border-emerald-400/60 ring-1 ring-emerald-400/30"
                                        : "border-slate-800 hover:border-emerald-300/40"
                                    }`}
                                    role="checkbox"
                                    aria-checked={isInstanceSelected}
                                    tabIndex={0}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      toggleInstanceSelected(selectedServiceKey!, instance.id);
                                    }}
                                    onKeyDown={(event) => {
                                      if (event.key === " " || event.key === "Enter") {
                                        event.preventDefault();
                                        toggleInstanceSelected(selectedServiceKey!, instance.id);
                                      }
                                    }}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="space-y-1 flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 text-xs">
                                          <span className="rounded-full border border-slate-600 bg-slate-800/70 px-2 py-0.5 text-slate-200 text-[10px]">
                                            v{instance.version}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div className="text-sm font-medium text-slate-100">
                                            <span className="font-semibold">{instance.machineName}</span>
                                            <span className="text-slate-500">:{instance.Port}</span>
                                          </div>
                                          <button
                                            type="button"
                                            className="inline-flex items-center justify-center w-5 h-5 rounded transition hover:bg-slate-800"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              // Health check action - could open modal or navigate
                                              window.open(instance.metricsURL, '_blank');
                                            }}
                                            title="View Health Check"
                                          >
                                            <svg className="w-4 h-4 text-emerald-400 hover:text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                          </button>
                                        </div>
                                      </div>
                                      <ServiceStatusBadge status={status} />
                                    </div>
                                    <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-400">
                                      <span className="truncate">Uptime {formatUptime(instance.uptime)}</span>
                                      <div className="flex gap-2 text-xs font-semibold text-emerald-300 flex-shrink-0">
                                        <a
                                          className="inline-flex items-center gap-0.5 transition hover:text-emerald-200"
                                          href={instance.logURL}
                                          target="_blank"
                                          rel="noreferrer"
                                          onClick={(event) => event.stopPropagation()}
                                          title="View Logs"
                                        >
                                          Logs ↗
                                        </a>
                                        <a
                                          className="inline-flex items-center gap-0.5 transition hover:text-emerald-200"
                                          href={instance.metricsURL}
                                          target="_blank"
                                          rel="noreferrer"
                                          onClick={(event) => event.stopPropagation()}
                                          title="View Metrics"
                                        >
                                          Metrics ↗
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
            </Card>
          ) : (
            <Card
              title="Instance Details"
              icon={<ServiceGlyph />}
              iconWrapperClassName="text-slate-400"
              className="border-slate-700 bg-slate-900/50"
              contentClassName="space-y-6 text-slate-200"
            >
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 rounded-full bg-slate-800/50 p-6">
                  <ServiceGlyph />
                </div>
                <h3 className="text-lg font-semibold text-slate-300 mb-2">
                  No Service Selected
                </h3>
                <p className="text-sm text-slate-400 max-w-md">
                  Select any service to view instances.
                </p>
              </div>
            </Card>
          )}
          </div>
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
