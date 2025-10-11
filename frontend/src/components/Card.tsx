import type { JSX, ReactNode } from "react";

export interface CardProps {
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  footer?: ReactNode;
  topRightAction?: ReactNode;
  className?: string;
  contentClassName?: string;
  titleClassName?: string;
  iconWrapperClassName?: string;
  onClick?: () => void;
  isActive?: boolean;
}

const baseClassName =
  "group rounded-2xl border border-slate-700 bg-slate-900/70 p-6 shadow-inner transition-all duration-200 ease-out hover:border-slate-500 hover:shadow-lg";

const titleBaseClassName =
  "mb-3 text-xl font-semibold text-slate-50 transition group-hover:text-slate-100";

const contentBaseClassName = "space-y-3 text-sm text-slate-400";

function composeClassName(...parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function Card({
  title,
  description,
  children,
  icon,
  footer,
  topRightAction,
  className,
  contentClassName,
  titleClassName,
  onClick,
  isActive,
  iconWrapperClassName,
}: CardProps): JSX.Element {
  const hasBodyContent = Boolean(description || children);
  const descriptionContent =
    typeof description === "string" || typeof description === "number"
      ? <p>{description}</p>
      : description;

  const interactiveClassName = onClick
    ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 hover:border-emerald-400/70 hover:shadow-emerald-400/15 hover:scale-[1.02]"
    : undefined;
  const activeClassName = isActive
    ? "border-emerald-300 ring-2 ring-emerald-300/70 ring-offset-2 ring-offset-slate-950 shadow-lg shadow-emerald-400/20 bg-slate-900/60"
    : undefined;

  return (
    <article
      className={composeClassName(baseClassName, interactiveClassName, activeClassName, className)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-pressed={onClick ? Boolean(isActive) : undefined}
    >
      <div className="flex items-start gap-4">
        {icon ? (
          <div className={composeClassName("mt-1", iconWrapperClassName)} aria-hidden>
            {icon}
          </div>
        ) : null}
        <div className="flex-1">
          {title ? (
            <h2 className={composeClassName(titleBaseClassName, titleClassName)}>{title}</h2>
          ) : null}
          {hasBodyContent ? (
            <div className={composeClassName(contentBaseClassName, contentClassName)}>
              {descriptionContent}
              {children}
            </div>
          ) : null}
        </div>
        {topRightAction ? (
          <div className="flex-shrink-0">
            {topRightAction}
          </div>
        ) : null}
      </div>
      {footer ? <div className="mt-6 border-t border-slate-800 pt-4">{footer}</div> : null}
    </article>
  );
}
