# Frontend Component Technical Documentation

This document covers every React component and TSX-based module that ships with the monitoring dashboard frontend. For each entry you will find its responsibilities, the data or utilities it depends on, and notable implementation details that are helpful when extending or integrating with the component.

## Entry & Context

### `src/main.tsx` — React Root
- Mounts the application under the `#root` element using `ReactDOM.createRoot` in `StrictMode`.
- Wraps `<App />` with `<ThemeProvider>` so the theme context is available before any UI renders.
- Throws early if the root element is missing, preventing a silent failure during bootstrap.

### `src/App.tsx` — Application Shell
- Provides the top-level layout: header, collapsible sidebar, scrollable main content, and footer.
- Local state:
  - `currentView`: toggles between infrastructure and services canvases.
  - `isSidebarCollapsed`: controls the navigation width.
  - `isAddInfraModalOpen` / `isAddServiceModalOpen`: reveal admin modals.
- Delegates body rendering to `InfrastructureView` or `ServicesView` via `renderContent()`.
- Passes view-selection, collapse, and “add” callbacks down to `Sidebar`; logs form submissions from admin modals (integration point for a real backend).

### `src/context/ThemeContext.tsx` — Theme Provider & Hook
- Exposes `theme`, `setTheme`, and `toggleTheme` via React context; `useTheme()` throws if called outside `<ThemeProvider />`.
- Persists the selected mode (`light` or `dark`) under `monitoring-dashboard-theme` and falls back to the user’s system preference.
- Applies synchronized `theme-dark/light` and `dark/light` classes to both `<html>` and `<body>` plus a `data-theme` attribute so Tailwind and custom CSS can respond immediately.
- All theme mutations run inside React state setters to keep rerenders predictable.

## Layout & Navigation

### `src/components/layout/Header.tsx`
- Consumes `useTheme()` to show a sun/moon toggle button with accessible labels.
- Provides space for product naming and an avatar placeholder; intentionally minimal to act as a shell header.

### `src/components/layout/Sidebar.tsx`
- Props accept the active view, change handlers, collapse controls, and admin action callbacks.
- Internal state:
  - `expandedItems`: tracks submenu expansion per nav item (future-ready although submenus are placeholders today).
  - `showAdminActionsMenu`: toggles the floating admin actions popover.
- `NavigationItem` sub-component centralizes rendering and focus/hover behaviours; attaches `aria` affordances for collapsed mode tooltips.
- Admin menu exposes “Add/Edit Infrastructure/Service” entry points and forwards to parent callbacks, ready for wiring into workflows.
- Collapse toggle persists at the bottom of the sidebar and flips icon direction when compressed.

### `src/components/layout/Footer.tsx`
- Static status footer conveying build metadata and operational status indicator.
- Keeps responsive copy (`Operational` vs `All Systems Operational`) with a compact LED glyph.

## Shared UI Foundations

### `src/components/Card.tsx`
- Reusable container with optional title, description, icon, footer, right-hand action slot, and body content area.
- Props include `className` overrides, `contentClassName`, `titleClassName`, `iconWrapperClassName`, and interaction hooks (`onClick`, `isActive`).
- When `onClick` is provided the component adopts button-like semantics (`role="button"`, `tabIndex`, `aria-pressed`) and adds hover/active styling for keyboard accessibility.
- Uses an internal `composeClassName` helper to merge Tailwind utility sets cleanly.

### `src/components/shared/StatusIndicators.tsx`
- Exports three badge primitives: `StatusPill`, `TypeBadge`, and `ServiceStatusBadge`.
- Each component looks up label text and tone classes from `statusConfig`, `infraTypeConfig`, or `serviceStatusConfig` (defined in `features/infrastructure/config.tsx`).
- Provides consistent rounded, dot-prefixed pills for deployment status across infrastructure and services views.

### `src/components/shared/UsageMeter.tsx`
- Visualises a single utilisation metric as a horizontal bar with percentage and absolute usage/limit values.
- Accepts a `UsageMetric` object (`label`, `usage`, `limit`, `unit`, optional `barClassName`).
- Guard rails: caps ratios at 100%, guarantees a minimum visible bar width when usage > 0, and exposes `aria-valuenow/max` for assistive tech.

### `src/components/shared/CircularMetric.tsx`
- Generic circular meter for percentage- or count-based metrics; configurable size, color, and display mode via props.
- Uses SVG stroke math to animate progress and shows formatted usage/limit text inside the dial.
- Currently unused in production screens but ready for dashboards requiring radial gauges.

### `src/components/shared/SeparateProgressBars.tsx`
- Builds on an internal `CircularProgress` helper to render five small dials for ECS metrics (CPU request/limit, memory request/limit, pod count).
- Colour thresholds highlight saturation (green <60%, orange between 70–85%, red above 80%).
- Intended for cluster-level summaries where side-by-side ratios are easier to parse than stacked bars.

### `src/components/shared/EcsSummaryCard.tsx`
- Aggregates infrastructure data (`InfraDetail[]`) into region/environment/infraType summaries.
- Calculates totals (machines, services, pods) and cumulative CPU/memory usage vs capacity, deriving average utilisation percentages per grouping.
- Renders clickable cards that can inform upstream filters (`onSummaryCardClick`); highlights the currently active filter via the `selectedFilter` prop.
- Encodes different styling for ECS, Linux, and Windows groupings to reinforce platform identity.

## Icon Components

### `src/components/icons/InfraIcons.tsx`
- Houses SVG icon components: `LinuxIcon`, `WindowsIcon`, `EcsIcon`, `ServiceGlyph`, and `ProfileIcon`.
- Icons are implemented as lightweight functional components so they can be passed around (e.g., through config objects) and styled with Tailwind classes.

## Modal Components

### `src/components/modals/AddInfrastructureModal.tsx`
- Controlled modal for creating infrastructure records; renders only when `isOpen` is true.
- Manages form state (`InfrastructureData`) locally with sane defaults and resets on successful submission.
- Validates required fields via HTML constraints, emits the collected payload through `onSave`, then closes via `onClose`.
- Layout includes grouped selects for type/environment/region and uses consistent slate/emerald theming.

### `src/components/modals/AddServiceModal.tsx`
- Mirrors the infrastructure modal but captures service-specific metadata (`ServiceData`).
- Dropdown options cover module, hosting infrastructure, and service type; blank default indicates unselected state.
- Emits `onSave` followed by `onClose` after resetting form state.

### `src/components/infrastructure/HousekeepingModal.tsx`
- Multi-step modal orchestrated by `InfrastructureView` to simulate disk cleanup scripts.
- Props describe the current machine, optional `HousekeepingInfo` payload, loading state, and step (`initial`, `running`, `completed`).
- UI states:
  - Initial: shows risk assessment and granular file deletion plan (temp/log/cache/docker breakdown) once analysis data is provided.
  - Running: disables controls and displays a spinner while a simulated task executes.
  - Completed: presents before/after filesystem metrics and summary of reclaimed space.
- Calls `onConfirm` to trigger the clean-up simulation and `onCancel` to close/abort across all phases.

### `src/components/services/ActionConfirmationModal.tsx`
- Confirmation and results modal for bulk start/stop actions in the services view.
- Accepts a list of `ServicesInstance` objects and lazily groups them by service name for display.
- Tracks processing state locally (`isProcessing`, `showResults`, `results` array) and expects `onConfirm` to return detailed `ActionResult`s.
- Two-phase UI: confirmation with grouped instance list and action summary footer, followed by a results recap with separate success/failure sections.

## Infrastructure Experience

### `src/components/infrastructure/InfrastructureView.tsx`
- Full infrastructure dashboard combining summary cards, search, filtering, and machine detail drill-downs.
- Local state:
  - `searchQuery`, `summaryFilter`, and `activeTab` control the filtered machine list.
  - `expandedMachines` stores which cards reveal detailed panels (instances, metrics, file systems).
  - `housekeepingModal` and `removeModal` manage housekeeping workflow and retirement confirmation dialogs.
- Data sources: `InfraDetails` (fixture dataset), `infraTypeConfig` for styling, `profileLabels` for tag text, and `formatUptime` helpers.
- Filtering pipeline: applies infra-type tabs first, then optional summary card filter, then tokenised text search over machine name, infra metadata, and instance attributes.
- Renders `InfraSummaryCard` to visualise aggregate stats and allow quick filter selection.
- Machine cards surface status pills, active incidents, utilisation via `UsageMeter` or `SeparateProgressBars` (for ECS), and service instance tables with `ServiceStatusBadge`s.
- Provides convenience actions per machine: run housekeeping (opens `HousekeepingModal` with synthesized cleanup plan) or retire infrastructure (opens confirmation modal with risk copy).
- Contains helper utilities to fabricate disk usage scenarios for Linux/Windows machines so the housekeeping experience feels grounded.

## Services Experience

### `src/components/services/ServicesView.tsx`
- Orchestrates the services dashboard: profile-driven filtering, search, card expansion, and bulk instance actions.
- State overview:
  - `activeProfiles`: array of selected profiles (`"all"` fallback ensures sane default).
  - `expandedServices`: tracks which service cards are open.
  - `selectedInstances`: map of service keys to selected instance IDs used for bulk actions.
  - `searchQuery` and `modalState` (current action sheet parameters).
- Builds multiple memoized structures for performance: service variants per profile, aggregated stats per service, and machine metadata lookup from `InfraDetails`.
- Derives filtered services by profile selection plus name search, computing live counts of running/stopped instances to power “Start All / Stop All” buttons.
- Uses `ServicesSummary` for high-level profile health, `ProfileSelector` for multi-select inputs, and `ActionConfirmationModal` to confirm start/stop workflows.
- Service cards show per-profile stats, instance counts, and optional quick actions for the current selection (start/stop selected).
- Instance grids expose host metadata, uptime, status badge, and deep links to logs/metrics; selection is keyboard-accessible with checkbox semantics.
- Bulk operations simulate async success/failure and clear selection on completion for a believable admin flow.

### `src/components/services/ServicesSummary.tsx`
- Computes summary statistics per profile (services count, instances count, running/degraded/restarting totals, overall health %) from `ServicesInstances`.
- Includes an aggregated “all” profile entry and sorts profiles to keep the combined view first.
- Highlights active filters via `activeProfiles` and emits the clicked profile through `onProfileClick` to toggle selection.

### `src/components/services/ProfileSelector.tsx`
- Responsive profile picker that supports multi-select chips on desktop and a fallback `<select>` on mobile.
- Normalises behaviour of the special `"all"` profile (exclusive) versus individual profiles (add/remove semantics).
- Relies on `profileLabels` and `profileOrder` for display names and ordering.

## Configuration Utilities

### `src/features/infrastructure/config.tsx`
- Central configuration map for infrastructure and service metadata consumed across the UI.
- `infraTypeConfig`: describes labels, icons, styling classes, and metric bar colours for each `InfraType`.
- `statusConfig` / `serviceStatusConfig`: tie status enums to badge labels and Tailwind tone classes.
- `profileLabels` and `profileOrder`: power consistent naming and ordering of service profiles.
- Re-exports `ProfileIcon` and `ServiceGlyph` so config consumers can access icon components without extra imports.

