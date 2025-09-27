import type { UsageMetric } from "../../types/infrastructure";

type UsageMeterProps = UsageMetric;

export function UsageMeter({ label, usage, limit, unit, barClassName }: UsageMeterProps): JSX.Element {
  const ratio = limit > 0 ? Math.min(usage / limit, 1) : 0;
  const percentage = Math.round(ratio * 100);
  const formattedUsage = usage % 1 === 0 ? usage.toFixed(0) : usage.toFixed(1);
  const formattedLimit = limit % 1 === 0 ? limit.toFixed(0) : limit.toFixed(1);
  const widthPercent = usage === 0 ? 0 : Math.max(percentage, 4);
  const cappedUsage = limit > 0 ? Math.min(usage, limit) : usage;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-medium text-slate-200">{label}</span>
        <span>
          {formattedUsage}/{formattedLimit} {unit} · {percentage}%
        </span>
      </div>
      <div
        className="h-2 rounded-full bg-slate-800"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={limit > 0 ? limit : undefined}
        aria-valuenow={cappedUsage}
      >
        <div className={`h-full rounded-full ${barClassName}`} style={{ width: `${widthPercent}%` }} aria-hidden />
      </div>
    </div>
  );
}
