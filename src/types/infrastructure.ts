import type { JSX } from "react";

export type UsageMetric = {
  label: string;
  usage: number;
  limit: number;
  unit: string;
  barClassName: string;
};

export type InfraType = "linux" | "windows" | "ecs";

export type StatusLevel = "healthy" | "watch" | "scaling";

export type ServiceStatus = "running" | "degraded" | "restarting" | "starting" | "stopping" | "stopped";

export type InfraTypeConfig = {
  label: string;
  icon: () => JSX.Element;
  cardClassName: string;
  badgeClassName: string;
  iconTintClassName: string;
  metricBarClassNames: {
    cpu: string;
    memory: string;
  };
  description: string;
};

export type ServiceProfileKey =
  | "apacqa"
  | "apacuat"
  | "apacdailyrefresh"
  | "apacprod"
  | "apaccob"
  | "emeaqa"
  | "emeauat"
  | "emeadailyrefresh"
  | "emeaprod"
  | "emeacob"
  | "namqa"
  | "namuat"
  | "namdailyrefresh"
  | "namprod"
  | "namcob"
  | "dev"
  | "all"
  | string; // Allow any string to support dynamic profiles from backend

export type ServiceInstanceDetail = {
  id: string;
  machine: string;
  datacenter: string;
  status: ServiceStatus;
  uptimeMinutes: number;
  version: string;
  profile: ServiceProfileKey;
  logsUrl: string;
  metricsUrl: string;
};

export type ServiceDetail = {
  name: string;
  summary: string;
  machines: string[];
  instances: ServiceInstanceDetail[];
};

export type ServicesInstance = {
  id: string;
  serviceName: string;
  machineName: string;
  Port: number;
  infraType: InfraType;
  profile: ServiceProfileKey;
  envType?: string; // DEV, STAGING, PROD, COB
  uptime: number;
  version: string;
  logURL: string;
  metricsURL: string;
  status?: ServiceStatus;
};

export type InfraMetricsEntry = {
  usage: number;
  limit: number;
  unit: string;
};

export type EcsMetricsEntry = {
  request: number;
  limit: number;
  unit: string;
};

export type InfraMetrics = {
  cpu: InfraMetricsEntry;
  memory: InfraMetricsEntry;
};

export type EcsMetrics = {
  cpu: EcsMetricsEntry;
  memory: EcsMetricsEntry;
  pods: {
    count: number;
    unit: string;
  };
};

export type NonAllProfile = Exclude<ServiceProfileKey, "all">;

export type InfraDetail = {
  id: string;
  machineName: string;
  region: "APAC" | "NAM" | "EMEA";
  environment: "DEV" | "UAT" | "PROD" | "COB";
  datacenter: string;
  infraType: InfraType;
  status: StatusLevel;
  metrics: InfraMetrics | EcsMetrics;
  servicesInstances: ServicesInstance[];
  sericesInstances: string[];
};

export type BuildMachineOptions = {
  cpuLimit: number;
  memoryLimit: number;
  regionPool: string[];
};
