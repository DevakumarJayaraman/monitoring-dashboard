# Monitoring Dashboard Technical Documentation

This guide walks through the monitoring dashboard code base for new contributors. It covers project structure, data flow, styling conventions, key components, and recommended workflows.

---

## 1. Project Overview

The monitoring dashboard is a Vite + React + TypeScript application styled with Tailwind CSS. It provides two primary views:

- **Infrastructure View** — surfaces fleet-level metrics, utilization summaries, and machine drill-downs.
- **Services View** — aggregates service health across profiles, supports bulk operations, and exposes per-instance controls.

The app is designed for rapid experimentation. Most data is bundled as static fixtures that emulate backend responses, allowing contributors to tweak UI and interactions without spinning up a server.

### 1.1 Entry Points

| File | Responsibility |
| ---- | -------------- |
| `src/main.tsx` | React root; wraps `<App />` inside `<ThemeProvider>` for global light/dark theming. |
| `src/App.tsx` | Orchestrates high-level view switching (Infrastructure vs Services) and renders shared header controls. |

### 1.2 Runtime Environment
- **Node**: 18+
- **Package Manager**: npm (lockfile committed)
- **Tooling**: Vite dev server (`npm run dev`), TypeScript strict mode, ESLint flat config.

---

## 2. Theming Layer

### 2.1 Theme Provider (`src/context/ThemeContext.tsx`)
- Persists theme preference (`light` or `dark`) in `localStorage` (`monitoring-dashboard-theme`).
- Applies body classes `theme-light` or `theme-dark` so Tailwind-style overrides in `src/index.css` can adjust palette seamlessly.
- API:
  - `theme`: current mode
  - `setTheme(mode)`
  - `toggleTheme()`
- Usage: `const { theme, toggleTheme } = useTheme();`

### 2.2 Global Styles (`src/index.css`)
- Tailwind base plus custom CSS for:
  - Font smoothing / transitions
  - Light-mode overrides for background, text, border, and accent colors
  - Light/dark-friendly accent badges for service status and metrics

When introducing new Tailwind colors, ensure light-mode overrides exist to maintain readability.

---

## 3. Data Model

All runtime data is mocked under `src/features/infrastructure/data.ts` and `src/features/infrastructure/config.tsx`.

### 3.1 Types (`src/types/infrastructure.ts`)
Defines shared TypeScript types for:
- `InfraDetail` (machine-level payload)
- `ServicesInstance`, `ServiceProfileKey`
- Metric entries (`InfraMetrics`, `EcsMetrics`)

### 3.2 Static Data
- `InfraDetails`: array of machine definitions with associated instances and metrics.
- `ServicesInstances`: synthetic list of service deployments so the services view can demo filters and bulk actions.
- `profileLabels`: human-readable profile names (APAC QA, EMEA UAT, etc.).

When extending features:
- Update the type definitions first.
- Adjust fixtures in `data.ts` to surface the new fields for UI work.

---

## 4. UI Architecture

### 4.1 Shared Components
| Component | Purpose |
| --------- | ------- |
| `src/components/Card.tsx` | 3D-styled container with hover/active states; used across views. |
| `src/components/shared/StatusIndicators.tsx` | Status badge components for services (Running / Degraded / Restarting). |
| `src/components/shared/UsageMeter.tsx` | Horizontal bar meter (CPU/Memory). |
| `src/components/shared/SeparateProgressBars.tsx` | ECS-only stacked bars for requests/limits/pods. |
| `src/components/shared/EcsSummaryCard.tsx` | Infrastructure summary grid; exports `InfraSummaryCard` used in infra view. |

### 4.2 Infrastructure View (`src/components/infrastructure/InfrastructureView.tsx`)
Key responsibilities:
1. **Filtering**
   - Summary cards filter by `(region, environment, infraType)`.
   - Search box tokenizes queries and matches across machine names, types, and instance metadata.
2. **Layout**
   - Left column: summary cards & machine grid.
   - Right column: details panel for selected machine (metrics, running instances, quick links).
3. **State**
   - `searchQuery`, `summaryFilter`, `selectedMachineName` (local state).
   - Derived `filteredMachines` and `resolvedSelection` via `useMemo`.

### 4.3 Services View (`src/components/services/ServicesView.tsx`)
Responsibilities broken down:
1. **Profile Aggregation**
   - Builds profile-based service stats for summary cards (`ServicesSummary` component).
   - Maintains `activeProfiles` array so users can multi-select or fall back to `all`.
2. **Search & Bulk Actions**
   - `searchQuery` filters service cards.
   - Selection state stored in `selectedInstances` keyed by `profile-serviceName`.
   - Investors can perform start/stop (simulated) via `ActionConfirmationModal`.
3. **Card/Instance Rendering**
   - Cards collapse by default; expand to reveal instance grid and selection controls.
   - Instances display machine metadata, status badges, and external links (logs/metrics).

### 4.4 Services Summary (`src/components/services/ServicesSummary.tsx`)
- Displays per-profile stats (services count, running/degraded/restarting counts).
- Clicking a card toggles the profile filter in `ServicesView`.

### 4.5 Service Status Breakdown (`src/components/services/ServiceStatusBreakdown.tsx`)
- Derived counts for running/degraded/restarting instances across active profiles.
- Provides high-level health percentages (overall health, issues vs running).

### 4.6 Action Confirmation (`src/components/services/ActionConfirmationModal.tsx`)
- Re-usable modal for start/stop actions.
- Simulates async operations with randomized success/failure to demonstrate UX.
- Supplies results view listing successes/failures after confirmation.

### 4.7 Theme Toggle (`src/App.tsx`)
- Renders view selector and theme switch, leveraging `useTheme` context.
- UI text adapts based on current view (Infrastructure vs Services).

---

## 5. Styling Patterns

- Tailwind utility-first classes for rapid iteration.
- Service badges use emerald/amber/rose to reflect health states consistently.
- In light mode, accent backgrounds/text colors are remapped using CSS overrides (see `index.css`).
- `Card` component centralizes hover transitions; interactive cards use emerald highlights to match infra summary cards.

When introducing new components, prefer composing existing utilities over custom CSS. If you need custom behavior (e.g., gradient overlays), follow the pattern set in `Card.tsx` using pseudo-elements and transitions.

---

## 6. Adding New Features

### 6.1 Workflow Checklist
1. **Update Types**: Extend `src/types/infrastructure.ts` with new fields.
2. **Mock Data**: Adjust fixtures in `src/features/infrastructure/data.ts` to demo the new capability.
3. **UI Changes**:
   - For infrastructure features, update `InfrastructureView.tsx` and supporting shared components.
   - For services, update `ServicesView.tsx` and subcomponents (summary, breakdown, modals).
4. **Styling**: If the feature introduces new accent colors, ensure light-mode overrides are added.
5. **Testing**: Run `npm run lint` and visually inspect via `npm run dev`.

### 6.2 Example: Adding a “Maintenance” status
- Extend `ServiceStatus` union to include `"maintenance"`.
- Update `serviceStatusConfig` and status badge logic to handle the fourth state.
- Patch `ServicesSummary`, `ServiceStatusBreakdown`, and `ServicesView` to incorporate the new status into counts and conditional rendering.
- Update fixtures with sample maintenance instances for validation.

---

## 7. Theme Customization

To offer additional themes or adjust the palette:
1. Expand `ThemeMode` union in `ThemeContext.tsx`.
2. Append new body classes and overrides in `index.css` (e.g., `body.theme-solarized`).
3. Extend toggle control in `App.tsx` to select between multiple modes.

Note: The current implementation assumes binary light/dark; additional modes require UI adjustments for the toggle control.

---

## 8. Deployment Considerations

Even though this starter uses static data, production deployments should:
- Integrate with real APIs (REST or GraphQL) and move static fixtures to fetch calls.
- Introduce state management (React Query, Zustand) if data becomes dynamic.
- Add auth/role checks around destructive actions (start/stop services).
- Include monitoring for modal actions to capture failures.

---

## 9. Development Tips

- **Hot Module Replacement**: Vite updates UI without full reloads; keep components small to leverage this.
- **Type-safety**: Make liberal use of TypeScript `type`/`interface` exports from `src/types` to avoid duplicate structures.
- **Accessibility**: Components like `Card` expose `role="button"` and keyboard handlers when clickable; follow the same standards for new interactive elements.
- **Performance**: `useMemo`/`useCallback` guard expensive aggregations (profile summaries, filtered lists). When adding new derived data, memoize to avoid re-computation across renders.

---

## 10. Quick Reference

| Area | Entry Points |
| --- | --- |
| Theming | `src/context/ThemeContext.tsx`, `src/index.css` |
| Infrastructure | `src/components/infrastructure/InfrastructureView.tsx`, `src/components/shared/EcsSummaryCard.tsx` |
| Services | `src/components/services/ServicesView.tsx`, `src/components/services/ServicesSummary.tsx`, `src/components/services/ServiceStatusBreakdown.tsx`, `src/components/services/ActionConfirmationModal.tsx` |
| Shared | `src/components/Card.tsx`, `src/components/shared/StatusIndicators.tsx`, `src/components/shared/UsageMeter.tsx` |
| Data/Types | `src/features/infrastructure/config.tsx`, `src/features/infrastructure/data.ts`, `src/types/infrastructure.ts` |

---

## 11. Running Locally

```bash
npm install
npm run dev
```

Visit `http://localhost:5173/` (default Vite port). The theme toggle (top right) persists preference between sessions.

---

## 12. Troubleshooting

| Issue | Fix |
| ----- | --- |
| Styles not updating | Ensure `npm run dev` is running; Tailwind relies on JIT scanning. |
| Theme feels off in light mode | Revisit `body.theme-light` overrides in `index.css`. |
| Modal actions never resolve | `ActionConfirmationModal` simulates latency via `setTimeout`; check console for errors. |
| Type errors after editing data | Align new fields across `types/infrastructure.ts`, fixtures, and component usage. |

---

## 13. Future Enhancements

- Wire up real backend endpoints with error handling.
- Integrate charts (e.g., CPU/Memory over time) using lightweight libraries like `recharts` or `visx`.
- Introduce global notifications for bulk action results.
- Implement user preferences for default view (`infrastructure` vs `services`).

---

Happy building! This document should give newcomers the context needed to navigate the codebase and evolve the monitoring dashboard safely.
