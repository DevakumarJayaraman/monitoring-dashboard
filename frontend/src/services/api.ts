// API configuration and service functions for backend communication
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export interface ApiComponent {
  componentId: number;
  componentName: string;
  description?: string;
  module?: string;
  projectId?: number;
  projectName?: string;
  totalDeployments?: number;
  defaultInfraType?: string;
  defaultPort?: number;
}

export interface ApiComponentWithServices {
  componentId: number;
  componentName: string;
  description?: string;
  module?: string;
  projectId?: number;
  projectName?: string;
  defaultInfraType?: string;
  defaultPort?: number;
  serviceInstanceCount?: number;
  serviceInstances?: Array<{
    instanceId: string;
    serviceName: string;
    machineName: string;
    infraType: string;
    profile: string;
    version?: string;
    port?: number;
    uptimeSeconds?: number;
    status?: string;
    logUrl?: string;
    metricsUrl?: string;
  }>;
  deploymentConfigs?: Array<{
    configId: number;
    componentId: number;
    infraId: number;
    basePort?: number;
    enabled?: boolean;
    profile?: string;
    deployParams?: Record<string, string>;
  }>;
}

export interface ApiComponentDeployment {
  configId?: number;
  componentId: number;
  componentName?: string;
  infraId: number;
  infraType?: string;
  profile?: string;
  port?: number;
  hostname?: string;
  environment?: string;
  region?: string;
  dynamicParams?: Record<string, string>;
}

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
  status?: 'running' | 'degraded' | 'restarting' | 'stopped' | 'starting' | 'stopping';
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
  profileId: number;
  projectId: number;
  projectName: string;
  environmentId: number;
  envCode: string;
  environmentDescription?: string | null;
  regionId?: number;
  regionCode?: string | null;
  regionDescription?: string | null;
  perId: number;
  activeFlag?: boolean | null;
  mappingCreatedAt?: string | null;
  profileCode: string;
  profileDescription?: string | null;
  status?: string | null;
  profileCreatedAt?: string | null;
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
    const response = await fetch(`${API_BASE_URL}/services/getAllServiceInstances`);
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
  const response = await fetch(`${API_BASE_URL}/services/getServiceInstanceById/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch service instance: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchServiceInstancesByProfile(profile: string): Promise<ApiServiceInstance[]> {
  const response = await fetch(`${API_BASE_URL}/services/getServiceInstancesByProfile/${profile}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch service instances for profile ${profile}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchServiceInstancesByName(serviceName: string): Promise<ApiServiceInstance[]> {
  const response = await fetch(`${API_BASE_URL}/services/getServiceInstancesByName/${serviceName}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch instances for service ${serviceName}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchServiceInstancesByInfraType(infraType: string): Promise<ApiServiceInstance[]> {
  const response = await fetch(`${API_BASE_URL}/services/getServiceInstancesByInfraType/${infraType}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch service instances for infra type ${infraType}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchServiceInstancesByStatus(status: string): Promise<ApiServiceInstance[]> {
  const response = await fetch(`${API_BASE_URL}/services/getServiceInstancesByStatus/${status}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch service instances with status ${status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchServiceInstancesByProject(projectId: number): Promise<ApiServiceInstance[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/services/getServiceInstancesByProject/${projectId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch service instances for project ${projectId}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching service instances by project:', error);
    throw error;
  }
}

// Infrastructure API calls
export async function fetchAllInfrastructure(): Promise<ApiInfraDetail[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/infrastructure/getAllInfrastructure`);
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
  const response = await fetch(`${API_BASE_URL}/infrastructure/getInfrastructureById/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch infrastructure: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchAllInfrastructureDetails(): Promise<InfraDetailDTO[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/infrastructure/getAllInfrastructureDetails`);
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
  const response = await fetch(`${API_BASE_URL}/infrastructure/getInfrastructureDetailsById/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch infrastructure details: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchInfrastructureDetailsByType(type: string): Promise<InfraDetailDTO[]> {
  const response = await fetch(`${API_BASE_URL}/infrastructure/getInfrastructureDetailsByType/${type}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch infrastructure details by type ${type}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchInfrastructureDetailsByProject(projectId: number): Promise<InfraDetailDTO[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/infrastructure/getInfrastructureDetailsByProject/${projectId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch infrastructure details for project ${projectId}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching infrastructure details by project:', error);
    throw error;
  }
}

export async function fetchInfrastructureByName(name: string): Promise<ApiInfraDetail> {
  const response = await fetch(`${API_BASE_URL}/infrastructure/getInfrastructureByName/${name}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch infrastructure by name ${name}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchInfrastructureByType(type: string): Promise<ApiInfraDetail[]> {
  const response = await fetch(`${API_BASE_URL}/infrastructure/getInfrastructureByType/${type}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch infrastructure by type ${type}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchInfrastructureByEnvironment(environment: string): Promise<ApiInfraDetail[]> {
  const response = await fetch(`${API_BASE_URL}/infrastructure/getInfrastructureByEnvironment/${environment}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch infrastructure by environment ${environment}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchDistinctEnvironments(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/infrastructure/getDistinctEnvironments`);
    if (!response.ok) {
      throw new Error(`Failed to fetch environments: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching distinct environments:', error);
    throw error;
  }
}

export async function fetchDistinctRegions(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/infrastructure/getDistinctRegions`);
    if (!response.ok) {
      throw new Error(`Failed to fetch regions: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching distinct regions:', error);
    throw error;
  }
}

/**
 * Create new infrastructure
 */
export async function createInfrastructure(data: InfrastructureCreateDTO): Promise<InfraDetailDTO> {
  try {
    const response = await fetch(`${API_BASE_URL}/infrastructure/createInfrastructure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create infrastructure: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating infrastructure:', error);
    throw error;
  }
}

/**
 * Update existing infrastructure
 */
export async function updateInfrastructure(id: number, data: InfrastructureCreateDTO): Promise<InfraDetailDTO> {
  try {
    const response = await fetch(`${API_BASE_URL}/infrastructure/updateInfrastructure/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update infrastructure: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating infrastructure:', error);
    throw error;
  }
}

/**
 * Delete infrastructure
 */
export async function deleteInfrastructure(id: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/infrastructure/deleteInfrastructure/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete infrastructure: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting infrastructure:', error);
    throw error;
  }
}

/**
 * Project Management
 */

export interface EnvironmentDTO {
  envId: number;
  envCode: string;
  envDesc: string;
}

export interface RegionDTO {
  regionId: number;
  regionCode: string;
  regionDesc: string;
}

export interface ProjectEnvironmentMappingDTO {
  perId?: number; // Optional: for updates to existing mappings
  environmentId: number;
  regionId: number;
  profileCodes: string[];
}

export interface ProjectCreateDTO {
  projectName: string;
  description: string;
  activeFlag?: boolean;
  environmentMappings: ProjectEnvironmentMappingDTO[];
}

/**
 * Create a new project
 */
export async function createProject(data: ProjectCreateDTO): Promise<ApiProject> {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/createProject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Failed to create project: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

/**
 * Update an existing project
 */
export async function updateProject(id: number, data: ProjectCreateDTO): Promise<ApiProject> {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/updateProject/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Failed to update project: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

/**
 * Delete a project
 */
export async function deleteProject(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/projects/deleteProject/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete project: ${response.status}`);
  }
}

/**
 * Retire a project (set active_flag to false)
 * Only allowed if project has no environment mappings
 */
export async function retireProject(id: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/retireProject/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Failed to retire project: ${response.status}`);
    }
  } catch (error) {
    console.error('Error retiring project:', error);
    throw error;
  }
}

/**
 * Get all environments for project setup
 */
export async function fetchProjectEnvironments(): Promise<EnvironmentDTO[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/getAllEnvironments`);

    if (!response.ok) {
      throw new Error(`Failed to fetch environments: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching environments:', error);
    throw error;
  }
}

/**
 * Get all regions for project setup
 */
export async function fetchProjectRegions(): Promise<RegionDTO[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/getAllRegions`);

    if (!response.ok) {
      throw new Error(`Failed to fetch regions: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching regions:', error);
    throw error;
  }
}

/**
 * Fetch environment mappings for a specific project (for edit mode)
 */
export interface ProjectEnvironmentMappingDetailDTO {
  perId: number;
  environmentId: number;
  envCode: string;
  envDesc: string;
  regionId: number;
  regionCode: string;
  regionDesc: string;
  profileCodes: string[];
  activeFlag: boolean;
}

export async function fetchProjectMappings(projectId: number): Promise<ProjectEnvironmentMappingDetailDTO[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/getProjectMappings/${projectId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch project mappings: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching project mappings:', error);
    throw error;
  }
}

/**
 * Save a single environment/region mapping for a project
 */
export async function saveProjectMapping(
  projectId: number,
  mapping: ProjectEnvironmentMappingDTO
): Promise<ProjectEnvironmentMappingDetailDTO> {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/saveMappingForProject/${projectId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mapping),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Failed to save mapping: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving project mapping:', error);
    throw error;
  }
}

/**
 * Delete a single environment/region mapping
 */
export async function deleteProjectMapping(projectId: number, perId: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/deleteMappingForProject/${projectId}/${perId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Failed to delete mapping: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting project mapping:', error);
    throw error;
  }
}

// --- Type definitions for missing types ---
export interface InfrastructureCreateDTO {
  infraType: string;
  hostname: string;
  ipAddress?: string;
  environment: string;
  region?: string;
  datacenter?: string;
  status?: string;
  projectId?: number;
}

export interface ApiProject {
  id: number;
  name: string;
  description: string;
  totalServices: number;
  totalInfrastructure: number;
  healthStatus: 'healthy' | 'warning' | 'critical';
  lastUpdated: string;
  infrastructureByEnv: Record<string, Record<string, number>>;
}

export async function fetchAllProfiles(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/environments/getProfiles`);
  if (!response.ok) {
    throw new Error(`Failed to fetch profiles: ${response.statusText}`);
  }
  return response.json();
}

// Create/Update/Delete operations for Service Instances
export async function createServiceInstance(instance: Partial<ApiServiceInstance>): Promise<ApiServiceInstance> {
  const response = await fetch(`${API_BASE_URL}/services/createServiceInstance`, {
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
  const response = await fetch(`${API_BASE_URL}/services/updateServiceInstance/${id}`, {
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
  const response = await fetch(`${API_BASE_URL}/services/deleteServiceInstance/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete service instance: ${response.statusText}`);
  }
}

// Service Control API calls
export interface ServiceActionRequest {
  instanceIds: string[];
}

export interface ServiceActionResponse {
  instanceId: string;
  serviceName: string;
  success: boolean;
  message: string;
  newStatus?: 'running' | 'degraded' | 'restarting' | 'stopped' | 'starting' | 'stopping';
}

export async function startServiceInstances(instanceIds: string[]): Promise<ServiceActionResponse[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/services/startServiceInstances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ instanceIds }),
    });

    if (!response.ok) {
      throw new Error(`Failed to start service instances: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error starting service instances:', error);
    throw error;
  }
}

export async function stopServiceInstances(instanceIds: string[]): Promise<ServiceActionResponse[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/services/stopServiceInstances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ instanceIds }),
    });

    if (!response.ok) {
      throw new Error(`Failed to stop service instances: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error stopping service instances:', error);
    throw error;
  }
}

// Component API calls
export async function fetchComponentsByProject(projectId: number): Promise<ApiComponentWithServices[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/components/getComponentsByProject/${projectId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch components by project: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching components by project:', error);
    throw error;
  }
}

export interface CreateComponentPayload {
  componentName: string;
  module?: string;
  description?: string;
  projectId: number;
  defaultInfraType?: string;
  defaultPort?: number;
}

export async function createComponent(data: CreateComponentPayload): Promise<ApiComponent> {
  try {
    const response = await fetch(`${API_BASE_URL}/components/createComponent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create component: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating component:', error);
    throw error;
  }
}

export interface CreateComponentDeploymentsPayload {
  deployments: Array<{
    componentId: number;
    infraId: number;
    profile: string;
    port?: number;
    componentVersion?: string;
    status?: string;
    uptimeSeconds?: number;
    dynamicParams?: Record<string, string>;
  }>;
}

export async function createComponentDeployments(payload: CreateComponentDeploymentsPayload): Promise<ApiComponentDeployment[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/deployment-config/createBatch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create component deployments: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating component deployments:', error);
    throw error;
  }
}

export interface CreateDeploymentConfigPayload {
  componentId: number;
  infraId: number;
  profile: string;
  basePort: number;
  deployParams?: Record<string, string>;
}

export interface ApiDeploymentConfig {
  configId: number;
  basePort?: number;
  enabled?: boolean;
}

export interface UpdateDeploymentConfigPayload {
  componentId: number;
  infraId: number;
  profile: string;
  basePort?: number;
  deployParams?: Record<string, string>;
  enabled?: boolean;
}

export async function createDeploymentConfig(payload: CreateDeploymentConfigPayload): Promise<ApiDeploymentConfig> {
  try {
    const response = await fetch(`${API_BASE_URL}/deployment-config/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create deployment config: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating deployment config:', error);
    throw error;
  }
}

export async function updateDeploymentConfig(configId: number, payload: UpdateDeploymentConfigPayload): Promise<ApiDeploymentConfig> {
  try {
    const response = await fetch(`${API_BASE_URL}/deployment-config/${configId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update deployment config: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating deployment config:', error);
    throw error;
  }
}

export async function deleteDeploymentConfig(configId: number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/deployment-config/${configId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete deployment config: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting deployment config:', error);
    throw error;
  }
}

export async function fetchComponentDeploymentsByProject(projectId: number): Promise<ApiComponentDeployment[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/deployment-config/getByProject/${projectId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch component deployments: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching component deployments:', error);
    throw error;
  }
}

// Get all projects
export async function fetchAllProjects(): Promise<ApiProject[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/getAllProjects`);

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
}

export async function fetchProjectById(projectId: number): Promise<ApiProject> {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/getProjectById/${projectId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch project: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching project:', error);
    throw error;
  }
}

// Get all environments
export async function fetchAllEnvironments(): Promise<ProjectEnvironmentDTO[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/environments/getAllEnvironments`);
    if (!response.ok) {
      throw new Error(`Failed to fetch environments: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching environments:', error);
    throw error;
  }
}
