import type { InfraType, ServiceStatus, StatusLevel } from "../../types/infrastructure.ts";
import { infraTypeConfig, serviceStatusConfig, statusConfig } from "../../features/infrastructure/config.tsx";

type StatusPillProps = {
  status: StatusLevel;
};

export function StatusPill({ status }: StatusPillProps) {
  const { label, toneClassName } = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${toneClassName}`}
    >
      <span
        className="size-1.5 rounded-full opacity-80"
        style={{ backgroundColor: "currentColor" }}
        aria-hidden
      />
      {label}
    </span>
  );
}

type TypeBadgeProps = {
  type: InfraType;
};

export function TypeBadge({ type }: TypeBadgeProps) {
  const { label, badgeClassName } = infraTypeConfig[type];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClassName}`}
    >
      {label}
    </span>
  );
}

type ServiceStatusBadgeProps = {
  status: ServiceStatus;
};

export function ServiceStatusBadge({ status }: ServiceStatusBadgeProps) {
  const { label, toneClassName } = serviceStatusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${toneClassName}`}
    >
      <span
        className="size-1.5 rounded-full opacity-80"
        style={{ backgroundColor: "currentColor" }}
        aria-hidden
      />
      {label}
    </span>
  );
}
