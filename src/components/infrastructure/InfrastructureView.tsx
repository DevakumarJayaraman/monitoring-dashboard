import { useMemo, useState } from "react";

import { Card } from "../Card";
import { TypeBadge, ServiceStatusBadge } from "../shared/StatusIndicators";
import { UsageMeter } from "../shared/UsageMeter";
import { SeparateProgressBars } from "../shared/SeparateProgressBars";
import { InfraSummaryCard } from "../shared/EcsSummaryCard";
import { infraTypeConfig, profileLabels } from "../../features/infrastructure/config";
import { formatUptime, InfraDetails } from "../../features/infrastructure/data";
import type { InfraDetail, ServicesInstance, ServiceStatus, UsageMetric } from "../../types/infrastructure";

export function InfrastructureView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMachineName, setSelectedMachineName] = useState<string | null>(null);
  const [summaryFilter, setSummaryFilter] = useState<{
    region: string;
    environment: string;
    infraType: string;
  } | null>(null);

  const filteredMachines = useMemo(() => {
    // If no summary filter and no search query, don't show any machines
    if (!summaryFilter && !searchQuery.trim()) {
      return [];
    }
    
    let machines = InfraDetails;
    
    // Apply summary filter first if active
    if (summaryFilter) {
      machines = machines.filter(machine => 
        machine.region === summaryFilter.region &&
        machine.environment === summaryFilter.environment &&
        machine.infraType === summaryFilter.infraType
      );
    }
    
    // Then apply search query
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (normalizedQuery) {
      const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
      machines = machines.filter((machine) => {
        const typeConfig = infraTypeConfig[machine.infraType];
        const instanceTokens = machine.servicesInstances
          .map((instance) => `${instance.serviceName} ${instance.profile}`)
          .join(" ");
        const haystack = `${machine.machineName} ${machine.infraType} ${typeConfig.label} ${machine.region} ${machine.environment} ${machine.datacenter} ${instanceTokens}`.toLowerCase();

        return tokens.every((token) => haystack.includes(token));
      });
    }
    
    return machines;
  }, [searchQuery, summaryFilter]);

  const resultsLabel = useMemo(() => {
    if (!summaryFilter && !searchQuery.trim()) {
      return "Select a summary card or search to view machines";
    }
    return `${filteredMachines.length} of ${InfraDetails.length}`;
  }, [filteredMachines.length, summaryFilter, searchQuery]);

  const resolvedSelection = useMemo<InfraDetail | null>(() => {
    if (!selectedMachineName) return null;
    return filteredMachines.find((machine) => machine.machineName === selectedMachineName) ?? null;
  }, [filteredMachines, selectedMachineName]);

  const handleSummaryCardClick = (region: string, environment: string, infraType: string) => {
    setSummaryFilter({ region, environment, infraType });
    setSelectedMachineName(null); // Clear selected machine when applying filter
  };

  const handleClearFilter = () => {
    setSummaryFilter(null);
    setSearchQuery("");
    setSelectedMachineName(null);
  };

  const handleCardSelect = (machine: InfraDetail) => {
    setSelectedMachineName(machine.machineName);
  };

  const handleResetSelection = () => {
    setSelectedMachineName(null);
  };

  const toUsageMetrics = (detail: InfraDetail): UsageMetric[] => {
    const { metrics } = detail;
    const typeConfig = infraTypeConfig[detail.infraType];
    
    // Check if this is ECS metrics
    const isEcs = 'pods' in metrics;
    
    if (isEcs) {
      // For ECS, show request/limit and pods
      return [
        {
          label: "CPU Request/Limit",
          usage: metrics.cpu.request,
          limit: metrics.cpu.limit,
          unit: metrics.cpu.unit,
          barClassName: typeConfig.metricBarClassNames.cpu,
        },
        {
          label: "Memory Request/Limit",
          usage: metrics.memory.request,
          limit: metrics.memory.limit,
          unit: metrics.memory.unit,
          barClassName: typeConfig.metricBarClassNames.memory,
        },
        {
          label: "Pods",
          usage: metrics.pods.count,
          limit: metrics.pods.count, // For pods, we just show the count
          unit: metrics.pods.unit,
          barClassName: "bg-amber-500", // Use amber for pods indicator
        },
      ];
    } else {
      // For VMs, show usage/limit
      return [
        {
          label: "CPU",
          usage: metrics.cpu.usage,
          limit: metrics.cpu.limit,
          unit: metrics.cpu.unit,
          barClassName: typeConfig.metricBarClassNames.cpu,
        },
        {
          label: "Memory",
          usage: metrics.memory.usage,
          limit: metrics.memory.limit,
          unit: metrics.memory.unit,
          barClassName: typeConfig.metricBarClassNames.memory,
        },
      ];
    }
  };

  const resolveInstanceStatus = (instance: ServicesInstance): ServiceStatus => {
    const raw = instance.status?.toLowerCase();
    if (raw === "degraded") return "degraded";
    if (raw === "restarting") return "restarting";
    if (raw === "stopped") return "degraded";
    if ((raw === "running" || raw === undefined) && instance.uptime <= 0) return "restarting";
    return "running";
  };

  return (
    <div className="space-y-6">
      {/* Infrastructure Summary Card */}
      <InfraSummaryCard 
        infraDetails={InfraDetails} 
        onSummaryCardClick={handleSummaryCardClick}
        selectedFilter={summaryFilter}
      />

      {/* Search and Filter Controls */}
      <div className="space-y-4">
        {summaryFilter && (
          <div className="flex items-center gap-4 rounded-lg border border-emerald-400/50 bg-emerald-500/10 px-4 py-3 text-sm">
            <span className="text-emerald-100">
              Filtered by: <strong>{summaryFilter.region} • {summaryFilter.environment} • {summaryFilter.infraType.toUpperCase()}</strong>
            </span>
            <button
              onClick={handleClearFilter}
              className="rounded-full border border-emerald-400/70 px-3 py-1 text-xs font-medium text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
            >
              Clear Filter
            </button>
          </div>
        )}
        
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="flex flex-col gap-2 text-sm text-slate-300 sm:w-80">
            <span className="font-medium text-slate-200">Search machines</span>
            <input
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-inner placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              type="search"
              name="machine-search"
              placeholder="Search by name, type, datacenter, or service"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setSelectedMachineName(null);
              }}
            />
          </label>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Showing {resultsLabel}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,1fr)]">
        <div className="space-y-6">
          {!resolvedSelection && filteredMachines.length === 0 && !summaryFilter && !searchQuery.trim() ? (
            <div className="rounded-xl border border-slate-400/50 bg-slate-500/10 px-6 py-8 text-center text-sm text-slate-300">
              <div className="mb-3">
                <svg className="mx-auto size-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="font-medium text-slate-200 mb-2">Select Infrastructure to Explore</p>
              <p className="text-slate-400">
                Click on a summary card above to view machines from that region, environment, and type.
                <br />
                Or use the search box to find specific machines.
              </p>
            </div>
          ) : !resolvedSelection && filteredMachines.length ? (
            <div className="rounded-xl border border-emerald-400/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              Select a machine from the grid to inspect its health and running services.
            </div>
          ) : null}
          <div className="space-y-6">
            {filteredMachines.map((machine) => {
              const typeConfig = infraTypeConfig[machine.infraType];
              const Icon = typeConfig.icon;
              const isSelected = resolvedSelection?.machineName === machine.machineName;
              const cardMetrics = toUsageMetrics(machine);

              return (
                <Card
                  key={machine.machineName}
                  title={machine.machineName}
                  icon={<Icon />}
                  iconWrapperClassName={typeConfig.iconTintClassName}
                  className={typeConfig.cardClassName}
                  contentClassName="space-y-5 text-slate-200"
                  onClick={() => handleCardSelect(machine)}
                  isActive={isSelected}
                >
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                    <span>{machine.machineName}</span>
                    <span>•</span>
                    <TypeBadge type={machine.infraType} />
                    <span>•</span>
                    <span>{machine.datacenter}</span>
                    <span>•</span>
                    <span>{machine.environment}</span>
                  </div>
                  <div className="space-y-4">
                    {machine.infraType === 'ecs' ? (
                      // For ECS, show separate progress bars for each metric
                      <SeparateProgressBars 
                        metrics={'pods' in machine.metrics ? machine.metrics : {
                          cpu: { request: 0, limit: 1, unit: 'vCPU' },
                          memory: { request: 0, limit: 1, unit: 'GiB' },
                          pods: { count: 0, unit: 'pods' }
                        }} 
                      />
                    ) : (
                      // For VMs, show traditional bar metrics
                      cardMetrics.map((metric) => (
                        <UsageMeter key={`${machine.machineName}-${metric.label}`} {...metric} />
                      ))
                    )}
                  </div>
                </Card>
              );
            })}
            {filteredMachines.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-sm text-slate-400">
                No machines match your search. Try a different name, infra type, or region.
              </div>
            ) : null}
          </div>
        </div>
        <aside className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-inner max-h-screen overflow-y-auto">
          {filteredMachines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <span className="text-sm font-semibold text-slate-200">No matches</span>
              <p className="text-xs text-slate-400">Update your search filters to view machine details.</p>
            </div>
          ) : resolvedSelection ? (
            <div className="space-y-6">
              <header className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-100">{resolvedSelection.machineName}</h2>
                    <p className="text-sm text-slate-400">{resolvedSelection.region} • {resolvedSelection.environment} • {resolvedSelection.servicesInstances.length} instances</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300 transition hover:border-emerald-400/70 hover:text-emerald-200"
                    onClick={handleResetSelection}
                  >
                    Reset
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <TypeBadge type={resolvedSelection.infraType} />
                </div>
              </header>
              <section className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Health overview</h3>
                {resolvedSelection.infraType === 'ecs' ? (
                  // For ECS, show separate progress bars
                  <SeparateProgressBars 
                    metrics={'pods' in resolvedSelection.metrics ? resolvedSelection.metrics : {
                      cpu: { request: 0, limit: 1, unit: 'vCPU' },
                      memory: { request: 0, limit: 1, unit: 'GiB' },
                      pods: { count: 0, unit: 'pods' }
                    }} 
                  />
                ) : (
                  // For VMs, show traditional bar metrics
                  <div className="space-y-4">
                    {toUsageMetrics(resolvedSelection).map((metric) => (
                      <UsageMeter key={`${resolvedSelection.machineName}-summary-${metric.label}`} {...metric} />
                    ))}
                  </div>
                )}
              </section>
              <section className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Running instances</h3>
                {resolvedSelection.servicesInstances.length ? (
                  <ul className="space-y-3">
                    {resolvedSelection.servicesInstances.map((instance) => (
                      <li
                        key={`${resolvedSelection.machineName}-instance-${instance.id}`}
                        className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4 shadow-inner transition hover:border-emerald-300/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-sm font-semibold text-slate-100">{instance.serviceName}</span>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="rounded-full border border-slate-600 bg-slate-800/80 px-2 py-0.5 font-semibold text-slate-200">
                                v{instance.version}
                              </span>
                              <span className="rounded-full border border-emerald-400/60 bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-200">
                                {profileLabels[instance.profile]}
                              </span>
                              <span className="font-medium text-slate-300">
                                Uptime {formatUptime(instance.uptime)}
                              </span>
                            </div>
                          </div>
                          <ServiceStatusBadge status={resolveInstanceStatus(instance)} />
                        </div>
                        <div className="text-xs text-slate-400">
                          Instance {instance.id} · Port {instance.Port}
                        </div>
                        <div className="text-xs text-slate-400">
                          Datacenter {resolvedSelection.datacenter}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs font-semibold text-emerald-300">
                          <a
                            className="inline-flex items-center gap-1 transition hover:text-emerald-200"
                            href={instance.logURL}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Logs ↗
                          </a>
                          <a
                            className="inline-flex items-center gap-1 transition hover:text-emerald-200"
                            href={instance.metricsURL}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Metrics ↗
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 shadow-inner text-xs text-slate-400">
                    No active instances are reporting from this machine.
                  </div>
                )}
              </section>
              <section className="space-y-3 text-xs text-slate-400">
                <strong className="block text-sm font-semibold text-slate-200">Platform notes</strong>
                <p>{infraTypeConfig[resolvedSelection.infraType].description}</p>
              </section>
            </div>
          ) : (
            <div className="flex flex-col gap-4 rounded-lg border border-emerald-400/50 bg-emerald-500/10 p-6">
              <span className="text-sm font-semibold text-emerald-100">Select a machine</span>
              <p className="text-xs text-emerald-200">Choose a card in the grid to inspect its health and running services.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
