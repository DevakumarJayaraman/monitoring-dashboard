// API configuration and endpoints
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// API types matching your backend response
export interface ApiServiceInstance {
  id: string;
  serviceName: string;
  machineName: string;
  infraType: 'linux' | 'windows' | 'ecs';
  profile: string;
  version: string;
  logURL: string;
  metricsURL: string;
  port: number;
  uptimeSeconds: number;
  status?: 'running' | 'degraded' | 'restarting';
}

export interface ApiInfraDetail {
  id: string;
  machineName: string;
  infraType: 'linux' | 'windows' | 'ecs';
  region: 'APAC' | 'NAM' | 'EMEA';
  environment: 'DEV' | 'UAT' | 'PROD' | 'COB';
  datacenter: string;
  metrics: {
    cpu: { usage?: number; request?: number; limit: number; unit: string };
    memory: { usage?: number; request?: number; limit: number; unit: string };
    pods?: { count: number; unit: string };
  };
  servicesInstances: string[];
}

// API client functions
export async function fetchServiceInstances(): Promise<ApiServiceInstance[]> {
  const response = await fetch(`${API_BASE_URL}/services/instances`);
  if (!response.ok) {
    throw new Error(`Failed to fetch service instances: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchInfrastructureDetails(): Promise<ApiInfraDetail[]> {
  const response = await fetch(`${API_BASE_URL}/infrastructure/details`);
  if (!response.ok) {
    throw new Error(`Failed to fetch infrastructure details: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchServiceSummaries(): Promise<Record<string, string>> {
  const response = await fetch(`${API_BASE_URL}/services/summaries`);
  if (!response.ok) {
    throw new Error(`Failed to fetch service summaries: ${response.statusText}`);
  }
  return response.json();
}

// Update event types
interface UpdateEvent {
  type: 'service_update' | 'infrastructure_update' | 'metrics_update';
  payload: ApiServiceInstance | ApiInfraDetail | Record<string, unknown>;
}

// Optional: Real-time updates using WebSocket or Server-Sent Events
export function subscribeToUpdates(onUpdate: (data: UpdateEvent) => void): () => void {
  const eventSource = new EventSource(`${API_BASE_URL}/events`);
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onUpdate(data);
  };

  eventSource.onerror = (error) => {
    console.error('EventSource failed:', error);
  };

  // Return cleanup function
  return () => eventSource.close();
}