export type Project = {
  id: string;
  name: string;
  description: string;
  totalServices: number;
  totalInfrastructure: number;
  healthStatus: "healthy" | "warning" | "critical";
  lastUpdated: string;
  // Infrastructure breakdown by environment and type
  // e.g., { "DEV": { "linux": 5, "windows": 3, "ecs": 2 }, "UAT": {...}, ... }
  infrastructureByEnv: Record<string, Record<string, number>>;
};
