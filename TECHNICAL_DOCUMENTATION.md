# Infrastructure Dashboard - Technical Documentation

## Overview

A React-based infrastructure and service management dashboard built with TypeScript, Vite, and Tailwind CSS. The application provides comprehensive monitoring capabilities for distributed systems across multiple deployment environments.

## Architecture

### Technology Stack
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5.4.20
- **Styling**: Tailwind CSS with custom dark theme
- **State Management**: React useState hooks
- **Type Safety**: Strict TypeScript configuration

### Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── infrastructure/   # Infrastructure-specific views
│   ├── services/        # Service management components
│   ├── shared/          # Common UI components
│   └── icons/           # SVG icon components
├── features/            # Feature-specific logic
│   └── infrastructure/  # Infrastructure domain
├── types/               # TypeScript type definitions
├── App.tsx             # Main application component
└── main.tsx            # Application entry point
```

## Components Documentation

### 1. Core Application Components

#### `App.tsx`
**Purpose**: Main application shell with view navigation
**Features**:
- Dual-view toggle between Infrastructure and Services
- Responsive header with dynamic titles and descriptions
- Clean view state management

**Key Props**: None (root component)
**State**: `activeView: "infrastructure" | "services"`

#### `Card.tsx` 
**Purpose**: Reusable card component for consistent UI presentation
**Features**:
- Flexible content layout with title, icon, body, and footer
- Interactive states (hover, active, clickable)
- Customizable styling through className composition
- Accessibility support with ARIA attributes

**Props**:
```typescript
type CardProps = {
  title?: string;
  description?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
  titleClassName?: string;
  onClick?: () => void;
  isActive?: boolean;
  iconWrapperClassName?: string;
};
```

### 2. Infrastructure Components

#### `InfrastructureView.tsx`
**Purpose**: Infrastructure monitoring dashboard
**Features**:
- Machine search and filtering by name, type, region, and services
- Interactive grid-based machine selection
- Detailed machine inspection sidebar
- Real-time metrics display with usage meters
- Service management controls

**Key Functionality**:
- Search-based filtering with multi-token support
- Master-detail interface pattern
- Dynamic grid layout (responsive)
- Service action buttons (Start, Restart, Terminate)

**State Management**:
- `searchQuery`: Filter machines by search terms
- `selectedMachineName`: Track selected machine for detail view

#### `UsageMeter.tsx`
**Purpose**: Visual representation of resource usage metrics
**Features**:
- Percentage-based progress bars
- Color-coded status indicators
- Accessibility support with ARIA meter role
- Responsive text formatting

**Props**:
```typescript
type UsageMeterProps = {
  label: string;
  usage: number;
  limit: number;
  unit: string;
  barClassName: string;
};
```

### 3. Service Management Components

#### `ServicesView.tsx`
**Purpose**: Service catalog and health monitoring
**Features**:
- Multi-environment service overview
- Profile-based service filtering
- Expandable service cards with instance details
- Cross-profile instance grouping
- Status aggregation and health summaries

**Key Features**:
- **Profile Management**: Support for 9 deployment environments (QA, UAT, Daily Refresh × 3 regions)
- **Service Aggregation**: Intelligent merging of service instances across profiles
- **Health Monitoring**: Color-coded status indicators with running/total counts
- **Instance Grouping**: Profile-based organization of service instances

**Advanced Functionality**:
```typescript
// Service variants mapping by name
const serviceVariantsByName = useMemo(() => {
  const map = new Map<string, Map<NonAllProfile, ServiceDetail>>();
  // Groups services by name across all profiles
});

// Statistical analysis per service
const serviceStatsByName = useMemo(() => {
  const stats = new Map<string, Array<{ 
    profileKey: NonAllProfile; 
    running: number; 
    total: number 
  }>>();
  // Calculates running/total stats per profile
});
```

#### `ProfileSelector.tsx`
**Purpose**: Environment profile selection interface
**Features**:
- Responsive design (button group on desktop, dropdown on mobile)
- ARIA radio group semantics
- Visual active state indicators
- Support for all 9 deployment environments

**Props**:
```typescript
type ProfileSelectorProps = {
  value: ServiceProfileKey;
  onChange: (profile: ServiceProfileKey) => void;
};
```

### 4. Shared Components

#### `StatusIndicators.tsx`
**Purpose**: Consistent status visualization across the application
**Components**:

1. **StatusPill**: Infrastructure machine status
2. **TypeBadge**: Machine type indicators (Linux, Windows, ECS)
3. **ServiceStatusBadge**: Service health status

**Features**:
- Consistent visual language for status representation
- Color-coded indicators with semantic meaning
- Accessibility-compliant contrast ratios

## Type System

### Core Types

#### `ServiceProfileKey`
Defines deployment environments:
```typescript
type ServiceProfileKey =
  | "apacqa" | "apacuat" | "apacdailyrefresh"
  | "emeaqa" | "emeauat" | "emeadailyrefresh" 
  | "namqa" | "namuat" | "namdailyrefresh"
  | "all";
```

#### `ServiceDetail`
Service definition with instance details:
```typescript
type ServiceDetail = {
  name: string;
  summary: string;
  machines: string[];
  logsUrl: string;
  metricsUrl: string;
  instances: ServiceInstanceDetail[];
  profile: ServiceProfileKey;
};
```

#### `InfraMachine`
Infrastructure machine representation:
```typescript
type InfraMachine = {
  name: string;
  type: InfraType;
  region: string;
  updatedMinutesAgo: number;
  status: StatusLevel;
  metrics: UsageMetric[];
  services: MachineService[];
};
```

## Configuration System

### Profile Management
- **9 Deployment Environments**: 3 regions × 3 environment types
- **Labels**: Human-readable profile names
- **Ordering**: Consistent profile display order
- **URL Generation**: Dynamic log/metrics URLs per environment

### Infrastructure Types
- **Linux VMs**: Ubuntu-based agents for build/API workloads
- **Windows VMs**: Server nodes for regression testing
- **ECS**: AWS Fargate tasks for stateless APIs

### Status Classifications
- **Infrastructure**: healthy, watch, scaling
- **Services**: running, degraded, restarting

## Features & Functionality

### 1. Infrastructure Monitoring
- **Search & Filter**: Multi-token search across machine properties
- **Health Visualization**: Real-time CPU/memory usage meters
- **Service Management**: Control running services per machine
- **Regional Overview**: Geographic distribution of resources

### 2. Service Management
- **Multi-Environment Support**: 9 deployment environments
- **Cross-Profile Aggregation**: Unified view of services across environments
- **Health Aggregation**: Status summaries with running/total counts
- **Instance Grouping**: Profile-based organization of service instances
- **2-Row Grid Summary**: Profile headers with color-coded instance counts

### 3. User Experience
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Dark Theme**: Consistent slate-based color scheme with emerald accents
- **Interactive States**: Hover effects, active states, focus management
- **Accessibility**: ARIA attributes, semantic HTML, keyboard navigation

## Data Flow

### Infrastructure View
```
Search Input → Filter Logic → Machine Grid → Selection → Detail Sidebar
     ↓              ↓           ↓           ↓          ↓
  useState    useMemo     Card Components  onClick   Machine Details
```

### Services View  
```
Profile Selection → Service Aggregation → Card Rendering → Instance Expansion
       ↓                   ↓                  ↓              ↓
   useState           useMemo Maps       Card Components   Grouped Display
```

## Performance Considerations

### Optimization Strategies
- **useMemo**: Expensive computations (service aggregation, filtering)
- **useCallback**: Stable function references for child components
- **Conditional Rendering**: Minimize DOM updates with strategic conditionals
- **Efficient Filtering**: Multi-token search with early exits

### Memory Management
- **Stable Keys**: Consistent React keys for list rendering
- **State Cleanup**: Reset expanded states on profile changes
- **Memoized Calculations**: Cache complex data transformations

## Development Guidelines

### Code Organization
- **Feature-based**: Group related components by domain
- **Shared Components**: Reusable UI elements in shared directory
- **Type Safety**: Comprehensive TypeScript coverage
- **Configuration**: Centralized constants and configurations

### Styling Approach
- **Tailwind CSS**: Utility-first styling with custom design system
- **Consistent Spacing**: 4px base grid system
- **Color System**: Semantic color naming with opacity variants
- **Responsive Design**: Mobile-first breakpoint strategy

### Testing Considerations
- **Component Isolation**: Each component has clear responsibilities
- **Props Interface**: Well-defined TypeScript interfaces
- **State Management**: Minimal, localized state
- **Pure Functions**: Utility functions for easy unit testing

## Build & Deployment

### Build Configuration
- **Vite**: Fast development and optimized production builds
- **TypeScript**: Strict type checking with modern target
- **Tailwind CSS**: JIT compilation with purging
- **Module Bundling**: ES modules with tree shaking

### Production Optimizations
- **Code Splitting**: Dynamic imports for route-based chunks
- **Asset Optimization**: Image compression and lazy loading
- **Bundle Analysis**: Size monitoring and optimization
- **Caching Strategy**: Long-term caching with content hashing

## Future Enhancements

### Planned Features
1. **Real-time Updates**: WebSocket integration for live metrics
2. **Historical Data**: Time-series charts for trend analysis  
3. **Alert System**: Configurable thresholds and notifications
4. **Bulk Operations**: Multi-select actions for services/machines
5. **Export Functionality**: CSV/JSON data export capabilities
6. **Advanced Filtering**: Date ranges, custom queries, saved filters

### Technical Improvements
1. **State Management**: Consider Zustand/Redux for complex state
2. **Testing Suite**: Comprehensive Jest/RTL test coverage
3. **Documentation**: Interactive Storybook component library
4. **Performance**: React.memo and virtualization for large lists
5. **Accessibility**: Enhanced screen reader support and keyboard navigation

---

*This documentation serves as a comprehensive guide for developers working on the Infrastructure Dashboard. For specific implementation details, refer to the inline code comments and TypeScript definitions.*