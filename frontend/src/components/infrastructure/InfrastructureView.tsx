import { useMemo, useState, useEffect } from "react";

import { Card } from "../Card.tsx";
import { StatusPill, TypeBadge, ServiceStatusBadge } from "../shared/StatusIndicators.tsx";
import { UsageMeter } from "../shared/UsageMeter.tsx";
import { SeparateProgressBars } from "../shared/SeparateProgressBars.tsx";
import { InfrastructureSummary } from "./InfrastructureSummary.tsx";
import { InfrastructureAggregate } from "./InfrastructureAggregate.tsx";
import { InfrastructureFormModal } from "./InfrastructureFormModal.tsx";
import { HousekeepingModal, type HousekeepingInfo, type HousekeepingStep } from "./HousekeepingModal.tsx";
import { infraTypeConfig } from "../../features/infrastructure/config.tsx";
import { formatUptime } from "../../features/infrastructure/data.ts";
import type { InfraDetail, ServicesInstance, ServiceStatus, UsageMetric, EcsMetrics, InfraMetrics, InfraType } from "../../types/infrastructure.ts";
import { 
  fetchAllInfrastructureDetails, 
  fetchAllServiceInstances, 
  fetchInfrastructureDetailsByProject,
  fetchServiceInstancesByProject,
  type InfraDetailDTO 
} from "../../services/api.ts";
import type { ApiServiceInstance } from "../../services/api.ts";
import type { Project } from "../../types/project.ts";

type FileSystemVolume = {
  mount: string;
  filesystemType: string;
  total: number;
  used: number;
  free: number;
  meter: UsageMetric;
};

const linuxFileSystems = [
  { mount: "/", total: 120, filesystemType: "ext4" },
  { mount: "/var/log", total: 80, filesystemType: "ext4" },
  { mount: "/data", total: 320, filesystemType: "xfs" },
];

const windowsFileSystems = [
  { mount: "C:\\", total: 256, filesystemType: "NTFS" },
  { mount: "D:\\Data", total: 512, filesystemType: "NTFS" },
  { mount: "E:\\Backups", total: 1024, filesystemType: "NTFS" },
];

function computeSeed(machineName: string): number {
  return machineName.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function getFileSystemSummary(machine: InfraDetail): FileSystemVolume[] {
  if (machine.infraType === "ecs") {
    return [];
  }

  const baseSeed = computeSeed(machine.machineName) % 37;
  const disks = machine.infraType === "linux" ? linuxFileSystems : windowsFileSystems;

  return disks.map((disk, index) => {
    const utilization = Math.min(0.55 + ((baseSeed + index * 7) % 35) / 100, 0.93);
    const used = Number((disk.total * utilization).toFixed(1));
    const free = Number((disk.total - used).toFixed(1));
    const usagePercent = (used / disk.total) * 100;

    let barClassName = machine.infraType === "linux" ? "bg-emerald-400" : "bg-sky-400";
    if (usagePercent >= 90) {
      barClassName = "bg-rose-500";
    } else if (usagePercent >= 75) {
      barClassName = "bg-amber-500";
    }

    return {
      mount: disk.mount,
      filesystemType: disk.filesystemType,
      total: disk.total,
      used,
      free,
      meter: {
        label: `${disk.mount} (${disk.filesystemType})`,
        usage: used,
        limit: disk.total,
        unit: "GiB",
        barClassName,
      },
    };
  });
}

type EnvironmentFilter = 'ALL' | 'DEV' | 'STAGING' | 'PROD_COB';

interface InfrastructureViewProps {
  selectedProject: Project | null;
}

export function InfrastructureView({ selectedProject }: InfrastructureViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMachines, setExpandedMachines] = useState<Set<string>>(new Set());
  const [selectedFilter, setSelectedFilter] = useState<{
    environment: string;
    region: string;
  } | null>(null);
  const [environmentFilter, setEnvironmentFilter] = useState<EnvironmentFilter>('ALL');
  const [infraTypeFilter, setInfraTypeFilter] = useState<InfraType | 'ALL'>('ALL');
  const [infraDetails, setInfraDetails] = useState<InfraDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [housekeepingModal, setHousekeepingModal] = useState<{
    isOpen: boolean;
    machine: InfraDetail | null;
    info: HousekeepingInfo | null;
    isLoading: boolean;
    step: HousekeepingStep;
  }>({
    isOpen: false,
    machine: null,
    info: null,
    isLoading: false,
    step: 'initial',
  });

  const [removeModal, setRemoveModal] = useState<{
    isOpen: boolean;
    machine: InfraDetail | null;
  }>({
    isOpen: false,
    machine: null,
  });

  const [formModal, setFormModal] = useState<{
    isOpen: boolean;
    machine: InfraDetail | null; // null for create, InfraDetail for edit
  }>({
    isOpen: false,
    machine: null,
  });

  // Fetch infrastructure data from backend
  useEffect(() => {
    const loadInfrastructure = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch infrastructure details and service instances
        // If a project is selected, fetch only data for that project
        const [infraData, servicesData] = await Promise.all([
          selectedProject 
            ? fetchInfrastructureDetailsByProject(parseInt(selectedProject.id))
            : fetchAllInfrastructureDetails(),
          selectedProject
            ? fetchServiceInstancesByProject(parseInt(selectedProject.id))
            : fetchAllServiceInstances()
        ]);
        
        // Convert backend data to frontend format
        const convertedInfra: InfraDetail[] = infraData.map((infra: InfraDetailDTO) => {
          // Find all service instances for this infrastructure
          const infraServices = servicesData.filter(
            (service: ApiServiceInstance) => service.machineName === infra.hostname
          );
          
          // Convert metrics based on infrastructure type
          let metrics: InfraMetrics | EcsMetrics;
          if (infra.infraType === 'ecs' && infra.ecsMetrics) {
            metrics = {
              cpu: {
                request: infra.ecsMetrics.cpu.requestMax || 0,
                limit: infra.ecsMetrics.cpu.limitMax || 0,
                unit: infra.ecsMetrics.cpu.unit || 'cores',
              },
              memory: {
                request: infra.ecsMetrics.memory.requestMax || 0,
                limit: infra.ecsMetrics.memory.limitMax || 0,
                unit: infra.ecsMetrics.memory.unit || 'GiB',
              },
              pods: {
                count: infra.ecsMetrics.pods.used || 0,
                unit: 'pods',
              },
            };
          } else if (infra.vmMetrics) {
            metrics = {
              cpu: {
                usage: infra.vmMetrics.cpu.used || 0,
                limit: infra.vmMetrics.cpu.max || 0,
                unit: infra.vmMetrics.cpu.unit || 'cores',
              },
              memory: {
                usage: infra.vmMetrics.memory.used || 0,
                limit: infra.vmMetrics.memory.max || 0,
                unit: infra.vmMetrics.memory.unit || 'GiB',
              },
            };
          }
          
          return {
            id: infra.infraId.toString(),
            machineName: infra.hostname,
            region: (infra.region || 'NAM') as "APAC" | "NAM" | "EMEA",
            environment: (infra.environment || 'DEV') as "DEV" | "UAT" | "PROD" | "COB",
            datacenter: infra.datacenter || 'Unknown',
            infraType: infra.infraType,
            status: (infra.status || 'healthy') as "healthy" | "watch" | "scaling",
            metrics,
            projectId: infra.projectId,
            projectName: infra.projectName,
            servicesInstances: infraServices.map((service: ApiServiceInstance) => ({
              id: service.id,
              serviceName: service.serviceName,
              machineName: service.machineName,
              Port: service.port,
              infraType: service.infraType,
              profile: service.profile,
              envType: service.envType,
              uptime: service.uptime,
              version: service.version,
              logURL: service.logURL,
              metricsURL: service.metricsURL,
              status: service.status,
            })),
            sericesInstances: [], // Legacy field, kept for compatibility
          };
        });
        
        setInfraDetails(convertedInfra);
      } catch (err) {
        console.error('Failed to load infrastructure:', err);
        setError(err instanceof Error ? err.message : 'Failed to load infrastructure');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInfrastructure();
  }, [selectedProject]); // Reload when project changes

  const filteredMachines = useMemo(() => {
    let machines = infraDetails;
    
    // Project filtering is now done at the API level, so we don't need to filter here
    // The data already contains only the selected project's infrastructure
    
    // Apply environment filter
    if (environmentFilter !== 'ALL') {
      machines = machines.filter(machine => {
        if (environmentFilter === 'DEV') {
          return machine.environment === 'DEV';
        } else if (environmentFilter === 'STAGING') {
          return machine.environment === 'UAT' || machine.environment === 'STAGING';
        } else if (environmentFilter === 'PROD_COB') {
          return machine.environment === 'PROD' || machine.environment === 'COB';
        }
        return true;
      });
    }
    
    // Apply selected filter if active (from summary card click)
    // Handle UAT/STAGING equivalence
    if (selectedFilter) {
      machines = machines.filter(machine => {
        const matchesRegion = machine.region === selectedFilter.region;
        const matchesEnvironment = 
          machine.environment === selectedFilter.environment ||
          (selectedFilter.environment === 'UAT' && machine.environment === 'STAGING') ||
          (selectedFilter.environment === 'STAGING' && machine.environment === 'UAT');
        return matchesRegion && matchesEnvironment;
      });
    }
    
    // Apply infrastructure type filter (from aggregate card click)
    if (infraTypeFilter !== 'ALL') {
      machines = machines.filter(machine => machine.infraType === infraTypeFilter);
    }
    
    // Then apply search query - filter only by machine name
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (normalizedQuery) {
      machines = machines.filter((machine) => {
        return machine.machineName.toLowerCase().includes(normalizedQuery);
      });
    }
    
    return machines;
    }, [searchQuery, selectedFilter, environmentFilter, infraTypeFilter, infraDetails]);

  // Filtered machines for aggregate (selected filter only, no search or infra type filter)
  const aggregateFilteredMachines = useMemo(() => {
    let machines = infraDetails;
    
    // Apply environment filter
    if (environmentFilter !== 'ALL') {
      machines = machines.filter(machine => {
        if (environmentFilter === 'DEV') {
          return machine.environment === 'DEV';
        } else if (environmentFilter === 'STAGING') {
          return machine.environment === 'UAT' || machine.environment === 'STAGING';
        } else if (environmentFilter === 'PROD_COB') {
          return machine.environment === 'PROD' || machine.environment === 'COB';
        }
        return true;
      });
    }
    
    // Apply selected filter if active (from summary card click)
    // Handle UAT/STAGING equivalence
    if (selectedFilter) {
      machines = machines.filter(machine => {
        const matchesRegion = machine.region === selectedFilter.region;
        const matchesEnvironment = 
          machine.environment === selectedFilter.environment ||
          (selectedFilter.environment === 'UAT' && machine.environment === 'STAGING') ||
          (selectedFilter.environment === 'STAGING' && machine.environment === 'UAT');
        return matchesRegion && matchesEnvironment;
      });
    }
    
    return machines;
  }, [selectedFilter, environmentFilter, infraDetails]);

  // Filtered machines for summary cards (only environment filter, no search/selection)
  const summaryFilteredMachines = useMemo(() => {
    let machines = infraDetails;
    
    // Project filtering is done at the API level
    // Apply environment filter
    if (environmentFilter !== 'ALL') {
      machines = machines.filter(machine => {
        if (environmentFilter === 'DEV') {
          return machine.environment === 'DEV';
        } else if (environmentFilter === 'STAGING') {
          return machine.environment === 'UAT' || machine.environment === 'STAGING';
        } else if (environmentFilter === 'PROD_COB') {
          return machine.environment === 'PROD' || machine.environment === 'COB';
        }
        return true;
      });
    }
    
    return machines;
  }, [environmentFilter, infraDetails]);

  const resultsLabel = useMemo(() => {
    return `${filteredMachines.length} of ${infraDetails.length}`;
  }, [filteredMachines.length, infraDetails.length]);

  // Group machines by ENV_CODE first, then by REGION
  const groupedMachines = useMemo(() => {
    const groups: Record<string, Record<string, InfraDetail[]>> = {};
    
    filteredMachines.forEach(machine => {
      const env = machine.environment;
      const region = machine.region || 'No Region';
      
      if (!groups[env]) {
        groups[env] = {};
      }
      
      if (!groups[env][region]) {
        groups[env][region] = [];
      }
      
      groups[env][region].push(machine);
    });
    
    return groups;
  }, [filteredMachines]);

  // Get sorted environment keys (DEV, STAGING, PROD, COB)
  const sortedEnvs = useMemo(() => {
    const envOrder = ['DEV', 'STAGING', 'PROD', 'COB'];
    const sorted = Object.keys(groupedMachines).sort((a, b) => {
      const indexA = envOrder.indexOf(a);
      const indexB = envOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
    return sorted;
  }, [groupedMachines]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-600 border-t-emerald-400"></div>
          <div className="text-slate-400">Loading infrastructure...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-rose-400 font-semibold mb-2">Error Loading Infrastructure</div>
          <div className="text-slate-400">{error}</div>
        </div>
      </div>
    );
  }

  const handleSummaryCardClick = (environment: string, region: string) => {
    setSelectedFilter({ environment, region });
    setExpandedMachines(new Set());
  };

  const handleClearFilter = () => {
    setSelectedFilter(null);
    setInfraTypeFilter('ALL');
    setSearchQuery("");
    setExpandedMachines(new Set());
  };

  const toggleMachineExpansion = (machineName: string) => {
    setExpandedMachines((current) => {
      const newSet = new Set(current);
      if (newSet.has(machineName)) {
        newSet.delete(machineName);
      } else {
        newSet.add(machineName);
      }
      return newSet;
    });
  };

  const handleRemoveClick = (machine: InfraDetail) => {
    setRemoveModal({
      isOpen: true,
      machine,
    });
  };

  const handleRemoveConfirm = () => {
    if (!removeModal.machine) return;
    
    console.log('Retiring infrastructure:', removeModal.machine.machineName);
    alert(`Infrastructure "${removeModal.machine.machineName}" has been marked for retirement.`);
    
    setRemoveModal({
      isOpen: false,
      machine: null,
    });
  };

  const handleRemoveCancel = () => {
    setRemoveModal({
      isOpen: false,
      machine: null,
    });
  };

  const generateHousekeepingInfo = (machine: InfraDetail): HousekeepingInfo => {
    // Simulate gathering cleanup information based on machine characteristics
    const seed = machine.machineName.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const baseRandom = (seed % 100) / 100;
    
    const tempCount = Math.floor(50 + baseRandom * 200);
    const tempSize = (0.5 + baseRandom * 2).toFixed(1);
    
    const logCount = Math.floor(20 + baseRandom * 80);
    const logSize = (2 + baseRandom * 15).toFixed(1);
    const oldestDays = Math.floor(7 + baseRandom * 90);
    
    const cacheCount = Math.floor(10 + baseRandom * 40);
    const cacheSize = (0.2 + baseRandom * 1.5).toFixed(1);
    
    const dockerCount = machine.infraType === 'ecs' ? Math.floor(5 + baseRandom * 20) : 0;
    const dockerSize = machine.infraType === 'ecs' ? (1 + baseRandom * 5).toFixed(1) : '0';
    
    const totalCleanup = (parseFloat(tempSize) + parseFloat(logSize) + parseFloat(cacheSize) + parseFloat(dockerSize)).toFixed(1);
    
    // Determine risk level based on cleanup size and file age
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (parseFloat(totalCleanup) > 10 || oldestDays < 14) {
      riskLevel = 'high';
    } else if (parseFloat(totalCleanup) > 5 || oldestDays < 30) {
      riskLevel = 'medium';
    }

    // Generate sample file lists
    const isLinux = machine.infraType === 'linux';
    const tempFiles = isLinux 
      ? ['/tmp/session_xyz123.tmp', '/tmp/cache_abc789.dat', '/var/tmp/old_data.tmp', '/tmp/temp_file_*.log']
      : ['C:\\Temp\\session_xyz123.tmp', 'C:\\Windows\\Temp\\cache_abc789.dat', 'C:\\Temp\\old_data.tmp'];
    
    const logFiles = isLinux
      ? ['/var/log/app/app.log.2024-09-15.gz', '/var/log/system.log.old', '/var/log/app/error.log.3', '/var/log/debug/*.log']
      : ['C:\\Logs\\app.log.2024-09-15', 'C:\\Logs\\system.log.old', 'C:\\Logs\\error.log.3'];
    
    const cacheFiles = isLinux
      ? ['/var/cache/app/*.cache', '/home/user/.cache/thumbnails/*', '/opt/app/cache/sessions/*']
      : ['C:\\ProgramData\\Cache\\*.cache', 'C:\\Users\\*\\AppData\\Local\\Temp\\*'];
    
    const dockerImageFiles = machine.infraType === 'ecs' 
      ? ['myapp:old-version-123', 'nginx:1.19.0', 'redis:5.0.9', 'unused-image:latest']
      : [];

    // Calculate file system before and after
    const fileSystemData = getFileSystemSummary(machine);
    const cleanupSizeGB = parseFloat(totalCleanup);
    
    const fileSystemBefore = fileSystemData.map(vol => ({
      mount: vol.mount,
      used: vol.used,
      total: vol.total,
      usedPercent: Math.round((vol.used / vol.total) * 100)
    }));

    const fileSystemAfter = fileSystemData.map((vol, idx) => {
      // Distribute cleanup across file systems proportionally
      const cleanupForThisVolume = idx === 0 ? cleanupSizeGB * 0.6 : cleanupSizeGB * 0.2;
      const newUsed = Math.max(0, vol.used - cleanupForThisVolume);
      return {
        mount: vol.mount,
        used: Number(newUsed.toFixed(1)),
        total: vol.total,
        usedPercent: Math.round((newUsed / vol.total) * 100)
      };
    });
    
    return {
      machineName: machine.machineName,
      infraType: machine.infraType,
      tempFiles: { count: tempCount, size: `${tempSize} GB`, files: tempFiles },
      logFiles: { count: logCount, size: `${logSize} GB`, oldestDays, files: logFiles },
      cacheFiles: { count: cacheCount, size: `${cacheSize} GB`, files: cacheFiles },
      dockerImages: { count: dockerCount, size: `${dockerSize} GB`, files: dockerImageFiles },
      estimatedCleanupSize: `${totalCleanup} GB`,
      riskLevel,
      fileSystemBefore,
      fileSystemAfter,
    };
  };

  const handleHousekeepingClick = async (machine: InfraDetail) => {
    setHousekeepingModal({
      isOpen: true,
      machine,
      info: null,
      isLoading: true,
      step: 'initial',
    });

    // Simulate gathering information
    setTimeout(() => {
      const info = generateHousekeepingInfo(machine);
      setHousekeepingModal(prev => ({
        ...prev,
        info,
        isLoading: false,
      }));
    }, 1500);
  };

  const handleHousekeepingConfirm = () => {
    if (!housekeepingModal.machine || !housekeepingModal.info) return;
    
    // Start running script
    setHousekeepingModal(prev => ({
      ...prev,
      step: 'running',
      isLoading: true,
    }));

    // Simulate script execution
    setTimeout(() => {
      setHousekeepingModal(prev => ({
        ...prev,
        step: 'completed',
        isLoading: false,
      }));
    }, 3000);
  };

  const handleHousekeepingCancel = () => {
    setHousekeepingModal({
      isOpen: false,
      machine: null,
      info: null,
      isLoading: false,
      step: 'initial',
    });
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
          limit: metrics.pods.count,
          unit: metrics.pods.unit,
          barClassName: "bg-amber-500",
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-100">Infrastructure Overview</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFormModal({ isOpen: true, machine: null })}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-emerald-700 hover:to-green-700 hover:shadow-lg"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Infrastructure</span>
          </button>
          <select
            value={environmentFilter}
            onChange={(e) => {
              setEnvironmentFilter(e.target.value as EnvironmentFilter);
              setSelectedFilter(null); // Reset selected filter when environment changes
              setExpandedMachines(new Set()); // Also reset expanded machines
            }}
            className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 shadow-sm transition-colors hover:border-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          >
            <option value="ALL">All Environments</option>
            <option value="DEV">Development</option>
            <option value="STAGING">Staging / UAT</option>
            <option value="PROD_COB">Production / COB</option>
          </select>
        </div>
      </div>

      {/* Infrastructure Summary - Card-based grid view */}
      <InfrastructureSummary
        infraDetails={summaryFilteredMachines}
        onCardClick={handleSummaryCardClick}
        selectedFilter={selectedFilter}
      />

      {/* Search and Filter Controls */}
      <div className="space-y-4">
        {selectedFilter && (
          <>
            <div className="flex items-center gap-4 rounded-lg border border-emerald-400/50 bg-emerald-500/10 px-4 py-3 text-sm">
              <span className="text-emerald-100">
                Filtered by: <strong>{selectedFilter.environment} • {selectedFilter.region}</strong>
                {infraTypeFilter !== 'ALL' && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-600/40 px-2 py-0.5 text-xs font-semibold">
                    • {infraTypeFilter.toUpperCase()}
                  </span>
                )}
              </span>
              <button
                onClick={handleClearFilter}
                className="rounded-full border border-emerald-400/70 px-3 py-1 text-xs font-medium text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
              >
                Clear Filter
              </button>
            </div>
            
            {/* Aggregate Summary */}
            <InfrastructureAggregate 
              machines={aggregateFilteredMachines}
              environment={selectedFilter.environment}
              region={selectedFilter.region}
              onInfraTypeClick={(infraType) => {
                setInfraTypeFilter(infraType);
                setSearchQuery(""); // Clear search when clicking aggregate card
              }}
              selectedInfraType={infraTypeFilter}
            />
          </>
        )}
        
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="flex flex-col gap-2 text-sm text-slate-300 sm:w-80">
            <span className="font-medium text-slate-200">Search machines</span>
            <input
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-inner placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              type="search"
              name="machine-search"
              placeholder="Search by Machine Name"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setExpandedMachines(new Set());
              }}
            />
          </label>
          
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Showing {resultsLabel}
          </span>
        </div>
      </div>

      {/* Grouped Infrastructure Cards by Environment and Region */}
      <div className="space-y-8">
        {filteredMachines.length === 0 ? (
          <div className="rounded-xl border border-slate-400/50 bg-slate-500/10 px-6 py-8 text-center text-sm text-slate-300">
            <div className="mb-3">
              <svg className="mx-auto size-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="font-medium text-slate-200 mb-2">No Infrastructure Found</p>
            <p className="text-slate-400">
              {selectedFilter 
                ? "No machines match the current filter. Try adjusting your search criteria or clearing the filter."
                : "No machines found for the selected infrastructure type. Try selecting a different tab or using the search box."}
            </p>
          </div>
        ) : (
          sortedEnvs.map((env) => {
            const regionGroups = groupedMachines[env];
            const sortedRegions = Object.keys(regionGroups).sort();
            
            return (
              <div key={env} className="space-y-6">
                {/* Regions within Environment */}
                {sortedRegions.map((region) => {
                  const machines = regionGroups[region];
                  
                  return (
                    <div key={`${env}-${region}`} className="space-y-4">
                      {/* Region Subheader */}
                      <div className="flex items-center gap-2 pl-4">
                        <div className="h-px flex-1 bg-slate-700"></div>
                        <h4 className="text-sm font-medium text-slate-400">
                          {region} Region • {machines.length} machine{machines.length !== 1 ? 's' : ''}
                        </h4>
                        <div className="h-px flex-1 bg-slate-700"></div>
                      </div>

                      {/* Machines in this Region */}
                      <div className="space-y-4 pl-8">
                        {machines.map((machine) => {
            const typeConfig = infraTypeConfig[machine.infraType];
            const Icon = typeConfig.icon;
            const isExpanded = expandedMachines.has(machine.machineName);
            const cardMetrics = toUsageMetrics(machine);
            const fileSystemData = getFileSystemSummary(machine);

            return (
              <Card
                key={machine.machineName}
                title={machine.machineName}
                icon={<Icon />}
                iconWrapperClassName={typeConfig.iconTintClassName}
                className={`${typeConfig.cardClassName} ${isExpanded ? 'ring-2 ring-opacity-50' : ''} transition-all duration-200`}
                contentClassName="space-y-4 text-slate-200"
              >
                {/* Header with machine info and expand button */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                    <span className="font-medium text-slate-200">{machine.machineName}</span>
                    <span>•</span>
                    <TypeBadge type={machine.infraType} />
                    <span>•</span>
                    <StatusPill status={machine.status} />
                    <span>•</span>
                    <span>{machine.region}</span>
                    <span>•</span>
                    <span>{machine.environment}</span>
                    <span>•</span>
                    <span>{machine.datacenter}</span>
                    <span>•</span>
                    <span className="text-emerald-300">{machine.servicesInstances.length} services</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setFormModal({ isOpen: true, machine })}
                      className="flex items-center gap-2 rounded-lg border border-blue-500/60 bg-gradient-to-r from-blue-500/20 to-sky-500/20 px-3 py-2 text-sm font-semibold text-blue-100 shadow-sm transition-all duration-200 hover:border-blue-400 hover:from-blue-500/30 hover:to-sky-500/30 hover:shadow-md hover:shadow-blue-500/20"
                      title="Edit Infrastructure"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    <button
                      onClick={() => handleRemoveClick(machine)}
                      className="flex items-center gap-2 rounded-lg border border-rose-500/60 bg-gradient-to-r from-rose-500/20 to-red-500/20 px-3 py-2 text-sm font-semibold text-rose-100 shadow-sm transition-all duration-200 hover:border-rose-400 hover:from-rose-500/30 hover:to-red-500/30 hover:shadow-md hover:shadow-rose-500/20"
                      title="Retire Infrastructure"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.924-1.333-2.664 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="hidden sm:inline">Remove</span>
                    </button>

                    {machine.infraType !== 'ecs' && (
                      <button
                        onClick={() => handleHousekeepingClick(machine)}
                        className="flex items-center gap-2 rounded-lg border border-amber-500/60 bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-3 py-2 text-sm font-semibold text-amber-100 shadow-sm transition-all duration-200 hover:border-amber-400 hover:from-amber-500/30 hover:to-orange-500/30 hover:shadow-md hover:shadow-amber-500/20"
                        title="Run Housekeeping Script"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        <span className="hidden sm:inline">Housekeeping</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => toggleMachineExpansion(machine.machineName)}
                      className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-700/70"
                    >
                      {isExpanded ? (
                        <>
                          <span>Collapse</span>
                          <svg className="h-4 w-4 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </>
                      ) : (
                        <>
                          <span>Expand</span>
                          <svg className="h-4 w-4 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Basic metrics - always visible */}
                <div className="space-y-3">
                  {machine.infraType === 'ecs' ? (
                    <SeparateProgressBars 
                      metrics={machine.metrics as EcsMetrics}
                    />
                  ) : (
                    <div className="space-y-3">
                      {cardMetrics.map((metric, index) => (
                        <UsageMeter key={index} {...metric} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-slate-600 pt-4 space-y-6">
                    {/* Services Summary */}
                    <div>
                      <h4 className="text-base font-medium text-slate-200 mb-3 flex items-center gap-2">
                        <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Running Services ({machine.servicesInstances.length})
                      </h4>
                      
                      {machine.servicesInstances.length > 0 ? (
                        <div className="space-y-2">
                          {machine.servicesInstances.map((instance) => {
                            const status = resolveInstanceStatus(instance);
                            
                            return (
                              <div key={instance.id} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/30 px-3 py-2">
                                <div className="flex items-center gap-3">
                                  <span className="font-medium text-slate-200 text-sm">
                                    {instance.serviceName}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {instance.profile}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    v{instance.version}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-400">
                                    {formatUptime(instance.uptime)}
                                  </span>
                                  <ServiceStatusBadge status={status} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-sm">No services are currently running on this machine.</p>
                      )}
                    </div>

                    {/* File System Summary for VMs */}
                    {machine.infraType !== 'ecs' && (
                      <div>
                        <h4 className="text-base font-medium text-slate-200 mb-3 flex items-center gap-2">
                          <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          File System Summary
                        </h4>
                        
                        <div className="space-y-3">
                          {fileSystemData.map((volume, index) => (
                            <div key={index} className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-slate-200">{volume.mount}</span>
                                  <span className="text-xs text-slate-400">({volume.filesystemType})</span>
                                </div>
                                <span className="text-xs text-slate-300">
                                  {volume.used} / {volume.total} GiB
                                </span>
                              </div>
                              <UsageMeter {...volume.meter} />
                              <div className="flex justify-between text-xs text-slate-400 mt-1">
                                <span>Used: {volume.used} GiB</span>
                                <span>Free: {volume.free} GiB</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {/* Remove Infrastructure Confirmation Modal */}
      {removeModal.isOpen && removeModal.machine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-rose-500/30 bg-slate-800 shadow-2xl">
            <div className="border-b border-slate-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-rose-500/20 p-2">
                  <svg className="h-6 w-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.924-1.333-2.664 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">
                    Confirm Infrastructure Retirement
                  </h3>
                  <p className="text-sm text-slate-400">
                    {removeModal.machine.machineName}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="space-y-4">
                <p className="text-sm text-slate-300">
                  Are you sure you want to retire this infrastructure? This action will:
                </p>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Stop all {removeModal.machine.servicesInstances.length} running service{removeModal.machine.servicesInstances.length !== 1 ? 's' : ''}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Remove the infrastructure from active monitoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Archive all logs and metrics</span>
                  </li>
                </ul>
                <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-3">
                  <p className="text-xs font-medium text-rose-200">
                    ⚠️ This action cannot be undone
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-600 px-6 py-4">
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleRemoveCancel}
                  className="rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveConfirm}
                  className="rounded-lg bg-gradient-to-r from-rose-600 to-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-rose-700 hover:to-red-700 hover:shadow-lg"
                >
                  Confirm Retirement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Housekeeping Modal */}
      <HousekeepingModal
        isOpen={housekeepingModal.isOpen}
        machine={housekeepingModal.machine}
        info={housekeepingModal.info}
        isLoading={housekeepingModal.isLoading}
        step={housekeepingModal.step}
        onConfirm={handleHousekeepingConfirm}
        onCancel={handleHousekeepingCancel}
      />

      {/* Infrastructure Form Modal (Add/Edit) */}
      <InfrastructureFormModal
        isOpen={formModal.isOpen}
        machine={formModal.machine}
        projectId={selectedProject ? parseInt(selectedProject.id) : undefined}
        selectedProject={selectedProject}
        onClose={() => setFormModal({ isOpen: false, machine: null })}
        onSuccess={() => {
          // Reload infrastructure data
          setFormModal({ isOpen: false, machine: null });
          // Trigger a re-fetch by changing a dependency or calling the load function
          const loadInfrastructure = async () => {
            try {
              setIsLoading(true);
              const [infraData, servicesData] = await Promise.all([
                selectedProject 
                  ? fetchInfrastructureDetailsByProject(parseInt(selectedProject.id))
                  : fetchAllInfrastructureDetails(),
                selectedProject
                  ? fetchServiceInstancesByProject(parseInt(selectedProject.id))
                  : fetchAllServiceInstances()
              ]);
              
              const convertedInfra: InfraDetail[] = infraData.map((infra: InfraDetailDTO) => {
                const infraServices = servicesData.filter(
                  (service: ApiServiceInstance) => service.machineName === infra.hostname
                );
                
                let metrics: InfraMetrics | EcsMetrics;
                if (infra.infraType === 'ecs' && infra.ecsMetrics) {
                  metrics = {
                    cpu: {
                      request: infra.ecsMetrics.cpu.requestMax || 0,
                      limit: infra.ecsMetrics.cpu.limitMax || 0,
                      unit: infra.ecsMetrics.cpu.unit || 'cores',
                    },
                    memory: {
                      request: infra.ecsMetrics.memory.requestMax || 0,
                      limit: infra.ecsMetrics.memory.limitMax || 0,
                      unit: infra.ecsMetrics.memory.unit || 'GiB',
                    },
                    pods: {
                      count: infra.ecsMetrics.pods.used || 0,
                      unit: 'pods',
                    },
                  };
                } else if (infra.vmMetrics) {
                  metrics = {
                    cpu: {
                      usage: infra.vmMetrics.cpu.used || 0,
                      limit: infra.vmMetrics.cpu.max || 0,
                      unit: infra.vmMetrics.cpu.unit || 'cores',
                    },
                    memory: {
                      usage: infra.vmMetrics.memory.used || 0,
                      limit: infra.vmMetrics.memory.max || 0,
                      unit: infra.vmMetrics.memory.unit || 'GiB',
                    },
                  };
                }
                
                return {
                  id: infra.infraId.toString(),
                  machineName: infra.hostname,
                  region: (infra.region || 'NAM') as "APAC" | "NAM" | "EMEA",
                  environment: (infra.environment || 'DEV') as "DEV" | "UAT" | "STAGING" | "PROD" | "COB",
                  datacenter: infra.datacenter || 'Unknown',
                  infraType: infra.infraType,
                  status: (infra.status || 'healthy') as "healthy" | "watch" | "scaling",
                  metrics,
                  projectId: infra.projectId,
                  projectName: infra.projectName,
                  servicesInstances: infraServices.map((service: ApiServiceInstance) => ({
                    id: service.id,
                    serviceName: service.serviceName,
                    machineName: service.machineName,
                    Port: service.port,
                    infraType: service.infraType,
                    profile: service.profile,
                    envType: service.envType,
                    uptime: service.uptime,
                    version: service.version,
                    logURL: service.logURL,
                    metricsURL: service.metricsURL,
                    status: service.status,
                  })),
                  sericesInstances: [],
                };
              });
              
              setInfraDetails(convertedInfra);
            } catch (err) {
              console.error('Failed to reload infrastructure:', err);
            } finally {
              setIsLoading(false);
            }
          };
          loadInfrastructure();
        }}
      />
    </div>
  );
}

