// API configuration and service functions for backend communication
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export interface ApiServiceInstance {
  id: string;
  serviceName: string;
  machineName: string;
  infraType: 'linux' | 'windows' | 'ecs';
  profile: string;
  envType?: string; // DEV, STAGING, PROD, COB
  version: string;
  logURL: string;
  metricsURL: string;
  port: number; // lowercase to match backend DTO standard conventions
  uptime: number; // in minutes
  status?: 'running' | 'degraded' | 'restarting';
}

export interface ApiInfraDetail {
  infraId: number;
  hostname: string;
  infraType: 'linux' | 'windows' | 'ecs';
  ipAddress?: string;
  environment: string;
  region?: string;
  datacenter?: string;
  status?: string;
  projectId?: number;
  projectName?: string;
  resourceLimits?: ResourceLimit[];
  currentMetrics?: UsageMetric[];
}

export interface ResourceLimit {
  metricId: number;
  resourceName: string;
  limitValue: string;
  unit: string;
}

export interface UsageMetric {
  metricId: number;
  metricName: string;
  metricValue: string;
  unit: string;
  metricTime?: string;
}

export interface ProjectEnvironmentDTO {
  envId: number;
  projectId: number;
  projectName: string;
  envCode: string;      // DEV, UAT, STAGING, PROD, COB
  regionCode?: string;  // APAC, EMEA, NAM
  profileCode: string;  // apacqa, apacuat, dev, apacprod, etc.
  description: string;
}

// Detailed Infrastructure Metrics interfaces
export interface InfraDetailDTO {
  infraId: number;
  infraType: 'linux' | 'windows' | 'ecs';
  hostname: string;
  ipAddress?: string;
  environment: string;
  region?: string;
  datacenter?: string;
  status?: string;
  projectId?: number;
  projectName?: string;
  vmMetrics?: VmMetrics;
  ecsMetrics?: EcsMetrics;
}

export interface VmMetrics {
  cpu: MetricDetail;
  memory: MetricDetail;
  disk: MetricDetail;
}

export interface EcsMetrics {
  cpu: EcsResourceMetric;
  memory: EcsResourceMetric;
  pods: PodMetric;
}

export interface MetricDetail {
  max?: number;
  used?: number;
  unit?: string;
  usagePercentage?: number;
}

export interface EcsResourceMetric {
  limitMax?: number;
  requestMax?: number;
  used?: number;
  unit?: string;
  usagePercentage?: number;
}

export interface PodMetric {
  max?: number;
  used?: number;
  usagePercentage?: number;
}

// Service Instance API calls
export async function fetchAllServiceInstances(): Promise<ApiServiceInstance[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/services/instances`);
    if (!response.ok) {
      throw new Error(`Failed to fetch service instances: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching service instances:', error);
    throw error;
  }
}

export async function fetchServiceInstanceById(id: string): Promise<ApiServiceInstance> {
  const response = await fetch(`${API_BASE_URL}/services/instances/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch service instance: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchServiceInstancesByProfile(profile: string): Promise<ApiServiceInstance[]> {
  const response = await fetch(`${API_BASE_URL}/services/instances/profile/${profile}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch service instances for profile ${profile}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchServiceInstancesByName(serviceName: string): Promise<ApiServiceInstance[]> {
  const response = await fetch(`${API_BASE_URL}/services/instances/name/${serviceName}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch instances for service ${serviceName}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchServiceInstancesByInfraType(infraType: string): Promise<ApiServiceInstance[]> {
  const response = await fetch(`${API_BASE_URL}/services/instances/type/${infraType}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch service instances for infra type ${infraType}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchServiceInstancesByStatus(status: string): Promise<ApiServiceInstance[]> {
  const response = await fetch(`${API_BASE_URL}/services/instances/status/${status}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch service instances with status ${status}: ${response.statusText}`);
  }
  return response.json();
}

// Infrastructure API calls
export async function fetchAllInfrastructure(): Promise<ApiInfraDetail[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/infrastructure`);
    if (!response.ok) {
      throw new Error(`Failed to fetch infrastructure: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching infrastructure:', error);
    throw error;
  }
}

export async function fetchInfrastructureById(id: number): Promise<ApiInfraDetail> {
  const response = await fetch(`${API_BASE_URL}/infrastructure/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch infrastructure: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchInfrastructureByType(type: string): Promise<ApiInfraDetail[]> {
  const response = await fetch(`${API_BASE_URL}/infrastructure/type/${type}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch infrastructure by type ${type}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchInfrastructureByEnvironment(environment: string): Promise<ApiInfraDetail[]> {
  const response = await fetch(`${API_BASE_URL}/infrastructure/environment/${environment}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch infrastructure by environment ${environment}: ${response.statusText}`);
  }
  return response.json();
}

// Infrastructure Details API calls (with comprehensive metrics)
export async function fetchAllInfrastructureDetails(): Promise<InfraDetailDTO[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/infrastructure/details`);
    if (!response.ok) {
      throw new Error(`Failed to fetch infrastructure details: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching infrastructure details:', error);
    throw error;
  }
}

export async function fetchInfrastructureDetailsById(id: number): Promise<InfraDetailDTO> {
  const response = await fetch(`${API_BASE_URL}/infrastructure/details/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch infrastructure details: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchInfrastructureDetailsByType(type: string): Promise<InfraDetailDTO[]> {
  const response = await fetch(`${API_BASE_URL}/infrastructure/details/type/${type}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch infrastructure details by type ${type}: ${response.statusText}`);
  }
  return response.json();
}

// Create/Update/Delete operations
export async function createServiceInstance(instance: Partial<ApiServiceInstance>): Promise<ApiServiceInstance> {
  const response = await fetch(`${API_BASE_URL}/services/instances`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(instance),
  });
  if (!response.ok) {
    throw new Error(`Failed to create service instance: ${response.statusText}`);
  }
  return response.json();
}

export async function updateServiceInstance(id: string, instance: Partial<ApiServiceInstance>): Promise<ApiServiceInstance> {
  const response = await fetch(`${API_BASE_URL}/services/instances/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(instance),
  });
  if (!response.ok) {
    throw new Error(`Failed to update service instance: ${response.statusText}`);
  }
  return response.json();
}

export async function deleteServiceInstance(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/services/instances/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete service instance: ${response.statusText}`);
  }
}

// Project Environment API calls
export async function fetchAllEnvironments(): Promise<ProjectEnvironmentDTO[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/environments`);
    if (!response.ok) {
      throw new Error(`Failed to fetch environments: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching environments:', error);
    throw error;
  }
}

export async function fetchAllProfiles(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/environments/profiles`);
    if (!response.ok) {
      throw new Error(`Failed to fetch profiles: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching profiles:', error);
    throw error;
  }
}

export async function fetchEnvironmentsByRegion(region: string): Promise<ProjectEnvironmentDTO[]> {
  const response = await fetch(`${API_BASE_URL}/environments/region/${region}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch environments for region ${region}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchEnvironmentsByEnvCode(envCode: string): Promise<ProjectEnvironmentDTO[]> {
  const response = await fetch(`${API_BASE_URL}/environments/envcode/${envCode}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch environments for code ${envCode}: ${response.statusText}`);
  }
  return response.json();
}
