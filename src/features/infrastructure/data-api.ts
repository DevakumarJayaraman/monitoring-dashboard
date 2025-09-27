import type {
  InfraDetail,
  InfraMetrics,
  EcsMetrics,
  InfraType,
  ServiceProfileKey,
  ServicesInstance,
  StatusLevel,
} from "../../types/infrastructure";

import { 
  fetchServiceInstances, 
  fetchInfrastructureDetails, 
  fetchServiceSummaries,
  type ApiServiceInstance,
  type ApiInfraDetail 
} from "./api";

// Cache for API data
let servicesInstancesCache: ServicesInstance[] = [];
let infraDetailsCache: InfraDetail[] = [];
let serviceSummaryByName: Record<string, string> = {};

// Loading states
let isLoading = false;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 seconds cache

function toMinutes(seconds: number): number {
  return Math.max(0, Math.round(seconds / 60));
}

export function formatUpdatedTime(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (remainder === 0) return `${hours}h ago`;
    return `${hours}h ${remainder}m ago`;
  }
  return `${minutes}m ago`;
}

export function formatUptime(minutes: number): string {
  if (minutes >= 1440) {
    const days = Math.floor(minutes / 1440);
    const remainder = minutes % 1440;
    const hours = Math.floor(remainder / 60);
    if (hours === 0) return `${days}d`;
    return `${days}d ${hours}h`;
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    if (remMinutes === 0) return `${hours}h`;
    return `${hours}h ${remMinutes}m`;
  }
  return `${minutes}m`;
}

function determineStatus(usage: number, limit: number): StatusLevel {
  const ratio = limit > 0 ? usage / limit : 0;
  if (ratio < 0.55) return "healthy";
  if (ratio < 0.8) return "watch";
  return "scaling";
}

function isEcsMetrics(metrics: InfraMetrics | EcsMetrics): metrics is EcsMetrics {
  return 'pods' in metrics;
}

// Convert API response to internal format
function transformApiServiceInstance(apiInstance: ApiServiceInstance): ServicesInstance {
  return {
    id: apiInstance.id,
    serviceName: apiInstance.serviceName,
    machineName: apiInstance.machineName,
    Port: apiInstance.port,
    infraType: apiInstance.infraType as InfraType,
    profile: apiInstance.profile as ServiceProfileKey,
    uptime: toMinutes(apiInstance.uptimeSeconds),
    version: apiInstance.version,
    logURL: apiInstance.logURL,
    metricsURL: apiInstance.metricsURL,
    status: apiInstance.status,
  };
}

function transformApiInfraDetail(apiDetail: ApiInfraDetail, servicesInstances: ServicesInstance[]): InfraDetail {
  const instances = apiDetail.servicesInstances
    .map((id) => servicesInstances.find(instance => instance.id === id))
    .filter((instance): instance is ServicesInstance => Boolean(instance));

  // Determine metrics format and status
  const metrics: InfraMetrics | EcsMetrics = apiDetail.metrics.pods
    ? {
        cpu: { request: apiDetail.metrics.cpu.request || 0, limit: apiDetail.metrics.cpu.limit, unit: apiDetail.metrics.cpu.unit },
        memory: { request: apiDetail.metrics.memory.request || 0, limit: apiDetail.metrics.memory.limit, unit: apiDetail.metrics.memory.unit },
        pods: apiDetail.metrics.pods
      } as EcsMetrics
    : {
        cpu: { usage: apiDetail.metrics.cpu.usage || 0, limit: apiDetail.metrics.cpu.limit, unit: apiDetail.metrics.cpu.unit },
        memory: { usage: apiDetail.metrics.memory.usage || 0, limit: apiDetail.metrics.memory.limit, unit: apiDetail.metrics.memory.unit }
      } as InfraMetrics;

  const cpuUtilization = isEcsMetrics(metrics) 
    ? metrics.cpu.request / metrics.cpu.limit
    : metrics.cpu.usage / metrics.cpu.limit;
  
  const status = determineStatus(cpuUtilization * 100, 100);

  return {
    id: apiDetail.id,
    machineName: apiDetail.machineName,
    infraType: apiDetail.infraType as InfraType,
    region: apiDetail.region,
    environment: apiDetail.environment,
    datacenter: apiDetail.datacenter,
    status,
    metrics,
    servicesInstances: instances,
    sericesInstances: apiDetail.servicesInstances, // Legacy field
  };
}

// Main data fetching function
async function fetchAllData(): Promise<void> {
  const now = Date.now();
  
  // Return cached data if still fresh
  if (!isLoading && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION) {
    return;
  }

  if (isLoading) {
    return; // Prevent multiple concurrent requests
  }

  try {
    isLoading = true;

    // Fetch all data in parallel
    const [apiServiceInstances, apiInfraDetails, apiServiceSummaries] = await Promise.all([
      fetchServiceInstances(),
      fetchInfrastructureDetails(), 
      fetchServiceSummaries()
    ]);

    // Transform data
    const transformedInstances = apiServiceInstances.map(transformApiServiceInstance);
    const transformedInfraDetails = apiInfraDetails.map(detail => 
      transformApiInfraDetail(detail, transformedInstances)
    ).sort((a, b) => a.machineName.localeCompare(b.machineName));

    // Update cache
    servicesInstancesCache = transformedInstances;
    infraDetailsCache = transformedInfraDetails;
    serviceSummaryByName = apiServiceSummaries;
    lastFetchTime = now;

  } catch (error) {
    console.error('Failed to fetch data from backend:', error);
    // Keep existing cache if available, or initialize with empty data
    if (servicesInstancesCache.length === 0) {
      servicesInstancesCache = [];
      infraDetailsCache = [];
      serviceSummaryByName = {};
    }
  } finally {
    isLoading = false;
  }
}

// Export functions to get data (these will trigger fetch if needed)
export async function getServicesInstances(): Promise<ServicesInstance[]> {
  await fetchAllData();
  return servicesInstancesCache;
}

export async function getInfraDetails(): Promise<InfraDetail[]> {
  await fetchAllData();
  return infraDetailsCache;
}

export async function getServiceSummaryByName(): Promise<Record<string, string>> {
  await fetchAllData();
  return serviceSummaryByName;
}

// For backward compatibility, export the data directly (but these will be empty initially)
// Components should use the async functions above instead
export const ServicesInstances: ServicesInstance[] = servicesInstancesCache;
export const InfraDetails: InfraDetail[] = infraDetailsCache;

// Initialize data on module load
fetchAllData();

export { serviceSummaryByName };