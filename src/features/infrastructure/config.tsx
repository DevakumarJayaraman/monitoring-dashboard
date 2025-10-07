import type {
  InfraType,
  InfraTypeConfig,
  ServiceProfileKey,
  ServiceStatus,
  StatusLevel,
} from "../../types/infrastructure";
import { EcsIcon, LinuxIcon, ProfileIcon, ServiceGlyph, WindowsIcon } from "../../components/icons/InfraIcons";

export const infraTypeConfig: Record<InfraType, InfraTypeConfig> = {
  linux: {
    label: "Linux VM",
    icon: LinuxIcon,
    cardClassName:
      "border-emerald-400/50 bg-emerald-500/5 hover:border-emerald-300/70 hover:shadow-emerald-400/20",
    badgeClassName: "bg-emerald-500/10 text-emerald-200 ring-1 ring-inset ring-emerald-400/40",
    iconTintClassName: "text-emerald-300",
    metricBarClassNames: {
      cpu: "bg-emerald-400",
      memory: "bg-emerald-300",
    },
    description: "ubuntu-22.04 LTS agents optimized for build and API workloads.",
  },
  windows: {
    label: "Windows VM",
    icon: WindowsIcon,
    cardClassName:
      "border-sky-400/50 bg-sky-500/5 hover:border-sky-300/70 hover:shadow-sky-400/20",
    badgeClassName: "bg-sky-500/10 text-sky-200 ring-1 ring-inset ring-sky-400/40",
    iconTintClassName: "text-sky-300",
    metricBarClassNames: {
      cpu: "bg-sky-400",
      memory: "bg-sky-300",
    },
    description: "Windows Server nodes handling regression suites and reporting.",
  },
  ecs: {
    label: "ECS",
    icon: EcsIcon,
    cardClassName:
      "border-amber-400/50 bg-amber-500/5 hover:border-amber-300/70 hover:shadow-amber-400/20",
    badgeClassName: "bg-amber-500/10 text-amber-200 ring-1 ring-inset ring-amber-400/40",
    iconTintClassName: "text-amber-300",
    metricBarClassNames: {
      cpu: "bg-amber-400",
      memory: "bg-amber-300",
    },
    description: "AWS Fargate tasks serving stateless edge APIs and pipelines.",
  },
};

export const statusConfig: Record<StatusLevel, { label: string; toneClassName: string }> = {
  healthy: {
    label: "Healthy",
    toneClassName: "bg-emerald-500/10 text-emerald-200 ring-1 ring-inset ring-emerald-400/40",
  },
  watch: {
    label: "Watch",
    toneClassName: "bg-amber-500/10 text-amber-200 ring-1 ring-inset ring-amber-400/40",
  },
  scaling: {
    label: "Scaling",
    toneClassName: "bg-rose-500/10 text-rose-200 ring-1 ring-inset ring-rose-400/40",
  },
};

export const serviceStatusConfig: Record<ServiceStatus, { label: string; toneClassName: string }> = {
  running: {
    label: "Running",
    toneClassName: "bg-emerald-500/10 text-emerald-200 ring-1 ring-inset ring-emerald-400/40",
  },
  degraded: {
    label: "Degraded",
    toneClassName: "bg-amber-500/10 text-amber-200 ring-1 ring-inset ring-amber-400/40",
  },
  stopped: {
    label: "Stopped",
    toneClassName: "bg-rose-500/10 text-rose-200 ring-1 ring-inset ring-rose-400/40",
  },
  restarting: {
    label: "Starting",
    toneClassName: "bg-cyan-500/10 text-cyan-200 ring-1 ring-inset ring-cyan-400/40",
  },
  starting: {
    label: "Starting",
    toneClassName: "bg-cyan-500/10 text-cyan-200 ring-1 ring-inset ring-cyan-400/40",
  },
  stopping: {
    label: "Stopping",
    toneClassName: "bg-orange-500/10 text-orange-200 ring-1 ring-inset ring-orange-400/40",
  },
};

export const profileLabels: Record<string, string> = {
  // APAC
  apacqa: "APAC QA",
  apacuat: "APAC UAT",
  apacdailyrefresh: "APAC Daily",
  apacprod: "APAC Production",
  apaccob: "APAC DR",
  
  // EMEA
  emeaqa: "EMEA QA",
  emeauat: "EMEA UAT",
  emeadailyrefresh: "EMEA Daily",
  emeaprod: "EMEA Production",
  emeacob: "EMEA DR",
  
  // NAM
  namqa: "NAM QA",
  namuat: "NAM UAT",
  namdailyrefresh: "NAM Daily",
  namprod: "NAM Production",
  namcob: "NAM DR",
  
  // Other
  dev: "Development",
  all: "All",
};

export const profileOrder: ServiceProfileKey[] = [
  "all",
  "apacqa",
  "apacuat",
  "apacdailyrefresh",
  "emeaqa",
  "emeauat",
  "emeadailyrefresh",
  "namqa",
  "namuat",
  "namdailyrefresh",
];

export { ProfileIcon, ServiceGlyph };
