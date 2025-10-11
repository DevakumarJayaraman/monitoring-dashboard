import { useCallback, useEffect, useMemo, useState } from "react";
import type { JSX } from "react";

import { Card } from "../Card.tsx";
import { ServiceStatusBadge } from "../shared/StatusIndicators.tsx";
import { ProfileSelector } from "./ProfileSelector.tsx";
import { ServicesSummary, type EnvironmentFilter } from "./ServicesSummary.tsx";
import { ActionConfirmationModal, type ActionResult } from "./ActionConfirmationModal.tsx";
import { ServiceGlyph } from "../../features/infrastructure/config.tsx";
import {
  formatUptime,
  serviceSummaryByName,
} from "../../features/infrastructure/data.ts";
import type {
  NonAllProfile,
  ServiceProfileKey,
  ServicesInstance,
  ServiceStatus,
} from "../../types/infrastructure.ts";
import { 
  fetchAllServiceInstances, 
  fetchServiceInstancesByProject,
  startServiceInstances, 
  stopServiceInstances,
  type ServiceActionResponse 
} from "../../services/api.ts";
import type { Project } from "../../types/project.ts";

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
  if (raw === "starting") return "starting";
  if (raw === "stopping") return "stopping";
  if (raw === "degraded") return "degraded";
  if (raw === "restarting") return "restarting";
  if (raw === "stopped") return "degraded";
  if ((raw === "running" || raw === undefined) && instance.uptime <= 0) return "restarting";
  return "running";
};

interface ServicesViewProps {
  selectedProject: Project | null;
  refreshKey?: number;
}

export function ServicesView({ selectedProject, refreshKey }: ServicesViewProps): JSX.Element {
  const [activeProfiles, setActiveProfiles] = useState<ServiceProfileKey[]>([]);
  const [environmentFilter, setEnvironmentFilter] = useState<EnvironmentFilter>('ALL');
  const [selectedInstances, setSelectedInstances] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServiceKey, setSelectedServiceKey] = useState<string | null>(null);
  const [servicesInstances, setServicesInstances] = useState<ServicesInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  
  // Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    action: "start" | "stop" | "restart";
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

  // Load services from backend
  const loadServices = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      // Fetch services filtered by project if one is selected
      const apiInstances = selectedProject
        ? await fetchServiceInstancesByProject(parseInt(selectedProject.id))
        : await fetchAllServiceInstances();
      
      // Convert API instances to frontend format
      const convertedInstances: ServicesInstance[] = apiInstances.map((api) => ({
        id: api.id,
        serviceName: api.serviceName,
        machineName: api.machineName,
        Port: api.port, // Convert lowercase port from API to uppercase Port for frontend
        infraType: api.infraType,
        profile: api.profile as ServiceProfileKey,
        envType: api.envType, // Add environment type
        uptime: api.uptime, // already in minutes from backend
        version: api.version,
        logURL: api.logURL,
        metricsURL: api.metricsURL,
        status: api.status,
      }));
      
      setServicesInstances(convertedInstances);
    } catch (err) {
      console.error('Failed to load services:', err);
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    if (!refreshKey) return;
    loadServices(true);
  }, [refreshKey, loadServices]);

  const environmentFilteredInstances = useMemo(() => {
    if (environmentFilter === 'ALL') {
      return servicesInstances;
    }

    if (environmentFilter === 'PROD_COB') {
      return servicesInstances.filter((instance) => {
        const env = (instance.envType ?? '').toUpperCase();
        return env === 'PROD' || env === 'COB';
      });
    }

    return servicesInstances.filter((instance) => (instance.envType ?? '').toUpperCase() === environmentFilter);
  }, [servicesInstances, environmentFilter]);

  const serviceSummaryMap = useMemo(
    () => new Map<string, string>(Object.entries(serviceSummaryByName)),
    []
  );

  const serviceVariantsByName = useMemo(() => {
    const map = new Map<string, Map<NonAllProfile, ServiceVariant>>();

    environmentFilteredInstances.forEach((instance) => {
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
  }, [serviceSummaryMap, environmentFilteredInstances]);

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

  useEffect(() => {
    setSelectedServiceKey(null);
    setSelectedInstances({});
  }, [environmentFilter]);

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

  const handleServiceSelectionAction = (serviceKey: string, action: "start" | "stop" | "restart") => {
    const service = filteredServices.find(s => `${s.profile}-${s.name}` === serviceKey);
    if (!service) {
      return;
    }

    const instanceIds = selectedInstances[serviceKey] ?? [];
    const eligibleInstances = service.instances.filter(instance => {
      if (!instanceIds.includes(instance.id)) return false;
      const status = normaliseStatus(instance);
      
      // Filter based on action type:
      // start: only degraded instances
      // stop: running OR starting OR restarting instances
      // restart: only running instances
      if (action === "start") return status === "degraded";
      if (action === "stop") return status === "running" || status === "starting" || status === "restarting";
      if (action === "restart") return status === "running";
      return false;
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
    // Get all degraded instances from services for global actions (selected service or all filtered services)
    const instances = servicesForGlobalActions.flatMap(service => 
      service.instances.filter(instance => normaliseStatus(instance) === "degraded")
    );
    
    if (instances.length === 0) {
      console.log('No degraded instances to start');
      return;
    }
    
    const serviceNames = servicesForGlobalActions.map(service => service.name);
    
    setModalState({
      isOpen: true,
      action: "start",
      actionType: "all",
      instances,
      serviceNames
    });
  };

  const handleStopAll = () => {
    // Get all running, starting, or restarting instances from services for global actions
    const instances = servicesForGlobalActions.flatMap(service => 
      service.instances.filter(instance => {
        const status = normaliseStatus(instance);
        return status === "running" || status === "starting" || status === "restarting";
      })
    );
    
    if (instances.length === 0) {
      console.log('No running/starting/restarting instances to stop');
      return;
    }
    
    const serviceNames = servicesForGlobalActions.map(service => service.name);
    
    setModalState({
      isOpen: true,
      action: "stop", 
      actionType: "all",
      instances,
      serviceNames
    });
  };

  const handleRestartAll = () => {
    // Get all running instances from services for global actions
    const instances = servicesForGlobalActions.flatMap(service => 
      service.instances.filter(instance => normaliseStatus(instance) === "running")
    );
    
    if (instances.length === 0) {
      console.log('No running instances to restart');
      return;
    }
    
    const serviceNames = servicesForGlobalActions.map(service => service.name);
    
    setModalState({
      isOpen: true,
      action: "restart",
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

    // Set action in progress to disable buttons
    setIsActionInProgress(true);

    const instanceIds = modalState.instances.map(instance => instance.id);
    const optimisticStatus: ServiceStatus = 
      modalState.action === 'start' ? 'starting' : 
      modalState.action === 'stop' ? 'stopping' : 'starting'; // Restart also shows as 'starting'
    
    // Optimistically update status to starting/stopping
    setServicesInstances(prevInstances => 
      prevInstances.map(instance => 
        instanceIds.includes(instance.id) 
          ? { ...instance, status: optimisticStatus }
          : instance
      )
    );

    try {
      let apiResults: ServiceActionResponse[];
      
      // Handle different actions
      if (modalState.action === 'restart') {
        // For restart: first stop, then start
        await stopServiceInstances(instanceIds);
        // Wait a bit for services to stop
        await new Promise(resolve => setTimeout(resolve, 1000));
        apiResults = await startServiceInstances(instanceIds);
      } else {
        // Regular start or stop
        apiResults = modalState.action === 'start'
          ? await startServiceInstances(instanceIds)
          : await stopServiceInstances(instanceIds);
      }
      
      // Update status based on API response
      setServicesInstances(prevInstances => 
        prevInstances.map(instance => {
          const result = apiResults.find(r => r.instanceId === instance.id);
          if (result && result.newStatus) {
            return { ...instance, status: result.newStatus };
          }
          return instance;
        })
      );
      
      // Convert API response to ActionResult format
      const results: ActionResult[] = apiResults.map(apiResult => ({
        instanceId: apiResult.instanceId,
        serviceName: apiResult.serviceName,
        success: apiResult.success,
        message: apiResult.message
      }));
      
      // Clear selections after successful action
      if (modalState.actionType === 'selected') {
        setSelectedInstances({});
      }
      
      // Immediate refresh to update summary and service lists
      loadServices(false);
      
      // Additional refresh after a short delay to get final updated status from backend
      setTimeout(() => {
        loadServices(true);
      }, 2000);
      
      return results;
    } catch (error) {
      console.error('Service action failed:', error);
      
      // Revert optimistic updates on error
      setServicesInstances(prevInstances => 
        prevInstances.map(instance => 
          instanceIds.includes(instance.id) 
            ? { ...instance, status: modalState.instances.find(i => i.id === instance.id)?.status }
            : instance
        )
      );
      
      // Return error results
      return modalState.instances.map(instance => ({
        instanceId: instance.id,
        serviceName: instance.serviceName,
        success: false,
        message: error instanceof Error ? error.message : 'Failed to perform action'
      }));
    } finally {
      // Re-enable buttons after action completes
      setIsActionInProgress(false);
    }
  };

  // Determine which services to consider for global actions
  const selectedService = selectedServiceKey 
    ? filteredServices.find(s => `${s.profile}-${s.name}` === selectedServiceKey)
    : null;
  
  // When a service card is selected, only consider its instances; otherwise consider all filtered services
  const servicesForGlobalActions = selectedService ? [selectedService] : filteredServices;

  // Calculate stats for global action buttons
  // Count degraded instances (for Start All button)
  const degradedVisibleInstances = servicesForGlobalActions.reduce((total, service) => {
    return total + service.instances.filter(instance => normaliseStatus(instance) === "degraded").length;
  }, 0);
  
  // Count running OR starting OR restarting instances (for Stop All button)
  const stoppableVisibleInstances = servicesForGlobalActions.reduce((total, service) => {
    return total + service.instances.filter(instance => {
      const status = normaliseStatus(instance);
      return status === "running" || status === "starting" || status === "restarting";
    }).length;
  }, 0);
  
  // Count running instances (for Restart All button)
  const restartableVisibleInstances = servicesForGlobalActions.reduce((total, service) => {
    return total + service.instances.filter(instance => normaliseStatus(instance) === "running").length;
  }, 0);

  // Show loading and error states
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading services...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Services Summary by Profile */}
      <ServicesSummary 
        key={`summary-${servicesInstances.length}-${servicesInstances.map(i => i.status).join('-')}`}
        servicesInstances={servicesInstances}
        activeProfiles={activeProfiles}
        environmentFilter={environmentFilter}
        onEnvironmentFilterChange={setEnvironmentFilter}
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
        <ProfileSelector 
          value={activeProfiles} 
          onChange={setActiveProfiles}
          environmentFilter={environmentFilter}
          servicesInstances={servicesInstances}
        />
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
            {/* Refresh Button */}
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-slate-200 ${
                isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => loadServices(true)}
              disabled={isRefreshing}
              title="Refresh service status"
            >
              <svg 
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            
            {/* Start/Stop/Restart All Services Buttons */}
            <div className="flex items-center gap-2 border-r border-slate-700 pr-3">
              <button
                type="button"
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  degradedVisibleInstances > 0 && !isActionInProgress
                    ? "border-emerald-400/50 text-emerald-200 hover:bg-emerald-400/10"
                    : "border-slate-700 text-slate-400 cursor-not-allowed"
                }`}
                onClick={handleStartAll}
                disabled={degradedVisibleInstances === 0 || isActionInProgress}
                title={selectedService ? `Start all ${degradedVisibleInstances} degraded instances in ${selectedService.name}` : `Start all ${degradedVisibleInstances} degraded services`}
              >
                ▶ Start All ({degradedVisibleInstances})
              </button>
              <button
                type="button"
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  stoppableVisibleInstances > 0 && !isActionInProgress
                    ? "border-rose-400/50 text-rose-200 hover:bg-rose-400/10"
                    : "border-slate-700 text-slate-400 cursor-not-allowed"
                }`}
                onClick={handleStopAll}
                disabled={stoppableVisibleInstances === 0 || isActionInProgress}
                title={selectedService ? `Stop all ${stoppableVisibleInstances} running/starting instances in ${selectedService.name}` : `Stop all ${stoppableVisibleInstances} running/starting services`}
              >
                ■ Stop All ({stoppableVisibleInstances})
              </button>
              <button
                type="button"
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  restartableVisibleInstances > 0 && !isActionInProgress
                    ? "border-cyan-400/50 text-cyan-200 hover:bg-cyan-400/10"
                    : "border-slate-700 text-slate-400 cursor-not-allowed"
                }`}
                onClick={handleRestartAll}
                disabled={restartableVisibleInstances === 0 || isActionInProgress}
                title={selectedService ? `Restart all ${restartableVisibleInstances} running instances in ${selectedService.name}` : `Restart all ${restartableVisibleInstances} running services`}
              >
                ⟳ Restart All ({restartableVisibleInstances})
              </button>
            </div>
          </div>
        </div>

      </div>
      )}
      
      {/* Service Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {activeProfiles.length > 0 ? (
          filteredServices.map((service) => {
            const serviceKey = `${service.profile}-${service.name}`;
            const isSelected = selectedServiceKey === serviceKey;
            const statusCounts = getStatusCounts(service.instances);
            const totalInstances = service.instances.length;
            const allProfileStats = getServiceProfileStats(service.name);

            const perProfileStats =
              service.profile === "all"
                ? allProfileStats.filter((stat) => activeProfiles.includes(stat.profileKey))
                : allProfileStats;

            const profileStat =
              service.profile !== "all"
                ? perProfileStats.find((stat) => stat.profileKey === (service.profile as NonAllProfile))
                : undefined;

            return (
              <div
                key={serviceKey}
                className={`transition-all ${isSelected ? "md:col-span-2" : ""}`}
              >
                <Card
                  title={service.name}
                  icon={<ServiceGlyph />}
                  iconWrapperClassName={isSelected ? "text-emerald-200" : "text-emerald-300"}
                  className={`${
                    isSelected
                      ? "border-emerald-400/70 bg-emerald-950/30 shadow-lg shadow-emerald-400/10 ring-1 ring-emerald-400/20"
                      : "border-slate-800 bg-slate-900/70 hover:border-emerald-300/60 hover:bg-slate-900/80 cursor-pointer"
                  } transition-all duration-200`}
                  contentClassName="space-y-3 text-slate-200"
                  onClick={() => toggleServiceExpanded(service.profile, service.name)}
                >
                  <div className="space-y-3">
                    <div className="space-y-2">
                      {isSelected && (
                        <p className="text-sm leading-relaxed text-slate-200">{service.summary}</p>
                      )}
                      {service.profile === "all" ? (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {perProfileStats.map(({ profileKey, running, total }) => (
                            <span
                              key={profileKey}
                              className={`rounded-full px-3 py-1 border ${getStatusBadgeClass(running, total)}`}
                            >
                              {profileKey} {running}/{total}
                            </span>
                          ))}
                          <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-200">
                            Total {statusCounts.running}/{totalInstances}
                          </span>
                        </div>
                      ) : profileStat ? (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-200">
                            {service.profile}
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

                  {isSelected && (
                    <div
                      className="mt-4 space-y-4 border-t border-slate-800 pt-4"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          {service.profile !== "all" && (
                            <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-200">
                              {service.profile}
                            </span>
                          )}
                          <span className="rounded-full border border-slate-700 px-3 py-1 text-slate-200">
                            Total {statusCounts.running}/{service.instances.length}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-emerald-200 hover:text-emerald-100 transition font-medium"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleServiceExpanded(service.profile, service.name);
                          }}
                        >
                          Collapse
                          <span aria-hidden>×</span>
                        </button>
                      </div>

                      {(() => {
                        const selection = selectedInstances[serviceKey] ?? [];
                        const hasSelection = selection.length > 0;
                        const selectedInstanceDetails = service.instances.filter((instance) =>
                          selection.includes(instance.id)
                        );

                        const startableSelectedCount = selectedInstanceDetails.filter(
                          (instance) => normaliseStatus(instance) === "degraded"
                        ).length;

                        const stoppableSelectedCount = selectedInstanceDetails.filter((instance) => {
                          const status = normaliseStatus(instance);
                          return status === "running" || status === "starting" || status === "restarting";
                        }).length;

                        const restartableSelectedCount = selectedInstanceDetails.filter(
                          (instance) => normaliseStatus(instance) === "running"
                        ).length;

                        return hasSelection ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition ${
                                startableSelectedCount > 0 && !isActionInProgress
                                  ? "border-emerald-400/50 text-emerald-200 hover:bg-emerald-400/10"
                                  : "border-slate-700 text-slate-500 cursor-not-allowed"
                              }`}
                              disabled={startableSelectedCount === 0 || isActionInProgress}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleServiceSelectionAction(serviceKey, "start");
                              }}
                              title="Start degraded instances"
                            >
                              ▶ Start ({startableSelectedCount})
                            </button>
                            <button
                              type="button"
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition ${
                                stoppableSelectedCount > 0 && !isActionInProgress
                                  ? "border-rose-400/50 text-rose-200 hover:bg-rose-400/10"
                                  : "border-slate-700 text-slate-500 cursor-not-allowed"
                              }`}
                              disabled={stoppableSelectedCount === 0 || isActionInProgress}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleServiceSelectionAction(serviceKey, "stop");
                              }}
                              title="Stop running/starting instances"
                            >
                              ■ Stop ({stoppableSelectedCount})
                            </button>
                            <button
                              type="button"
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition ${
                                restartableSelectedCount > 0 && !isActionInProgress
                                  ? "border-cyan-400/50 text-cyan-200 hover:bg-cyan-400/10"
                                  : "border-slate-700 text-slate-500 cursor-not-allowed"
                              }`}
                              disabled={restartableSelectedCount === 0 || isActionInProgress}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleServiceSelectionAction(serviceKey, "restart");
                              }}
                              title="Restart running instances"
                            >
                              ⟳ Restart ({restartableSelectedCount})
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-800"
                              onClick={(event) => {
                                event.stopPropagation();
                                clearSelection(serviceKey);
                              }}
                            >
                              Clear
                            </button>
                          </div>
                        ) : null;
                      })()}

                      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {service.instances.map((instance) => {
                          const status = normaliseStatus(instance);
                          const selection = selectedInstances[serviceKey] ?? [];
                          const isInstanceSelected = selection.includes(instance.id);

                          return (
                            <div
                              key={instance.id}
                              className={`group rounded-lg border px-3 py-2 transition cursor-pointer ${
                                isInstanceSelected
                                  ? "border-emerald-400/70 bg-emerald-900/40 shadow-inner ring-1 ring-emerald-400/30"
                                  : "border-slate-800 bg-slate-900/70 hover:border-emerald-300/40 hover:bg-slate-900/80"
                              }`}
                              role="checkbox"
                              aria-checked={isInstanceSelected}
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
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex items-center gap-1.5 text-xs">
                                    <span className="rounded-full border border-slate-600 bg-slate-800/70 px-2 py-0.5 text-slate-200 text-[10px]">
                                      {instance.profile}
                                    </span>
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
                                      className="inline-flex h-5 w-5 items-center justify-center rounded transition hover:bg-slate-800"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        window.open(instance.metricsURL, "_blank");
                                      }}
                                      title="View Health Check"
                                    >
                                      <svg
                                        className="h-4 w-4 text-emerald-400 hover:text-emerald-300"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                                <ServiceStatusBadge status={status} />
                              </div>
                              <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-400">
                                <span className="truncate">Uptime {formatUptime(instance.uptime)}</span>
                                <div className="flex flex-shrink-0 gap-2 text-xs font-semibold text-emerald-300">
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
                  )}
                </Card>
              </div>
            );
          })
        ) : (
          <div className="md:col-span-2">
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
                <h3 className="mb-2 text-lg font-semibold text-slate-300">
                  No Profile Selected
                </h3>
                <p className="max-w-md text-sm text-slate-400">
                  Select any profile summary card to view services.
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>

      <ActionConfirmationModal
        key={`modal-${modalState.isOpen}-${modalState.action}-${modalState.instances.length}`}
        isOpen={modalState.isOpen}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        action={modalState.action}
        actionType={modalState.actionType}
        instances={modalState.instances}
        currentInstances={servicesInstances}
        serviceNames={modalState.serviceNames}
      />
    </div>
  );
}
