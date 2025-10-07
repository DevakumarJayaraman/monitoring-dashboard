# Infrastructure Page Backend Integration

## Overview
The Infrastructure page has been updated to fetch data from the backend API instead of using static mock data. This enables real-time monitoring of infrastructure resources.

## Backend API Endpoints Used

### Infrastructure Endpoints
- `GET /api/infrastructure/details` - Fetch all infrastructure with detailed metrics
- `GET /api/infrastructure/details/{id}` - Fetch specific infrastructure by ID
- `GET /api/infrastructure/type/{type}` - Fetch infrastructure by type (linux/windows/ecs)
- `GET /api/infrastructure/environment/{environment}` - Fetch infrastructure by environment

### Service Instance Endpoints
- `GET /api/services/instances` - Fetch all service instances
- `GET /api/services/instances/{id}` - Fetch specific service instance
- `GET /api/services/instances/profile/{profile}` - Fetch instances by profile
- `GET /api/services/instances/name/{serviceName}` - Fetch instances by service name
- `GET /api/services/instances/type/{infraType}` - Fetch instances by infrastructure type
- `GET /api/services/instances/status/{status}` - Fetch instances by status

## Configuration

### Environment Variables
Set the backend API URL in your `.env` file:

```bash
VITE_API_BASE_URL=http://localhost:8080/api
```

If not set, the default URL is `http://localhost:8080/api`.

### Development Setup

1. **Start the Backend Server**
   ```bash
   cd backend
   ./gradlew bootRun
   ```

2. **Start the Frontend Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Features Implemented

### Infrastructure View
- ✅ Real-time data fetching from backend
- ✅ Loading state with spinner
- ✅ Error handling with user-friendly error messages
- ✅ Auto-refresh every 30 seconds
- ✅ Infrastructure filtering by type (ECS, Linux, Windows)
- ✅ Environment and region filtering
- ✅ Search functionality across all infrastructure attributes
- ✅ Detailed metrics display (CPU, Memory, Disk for VMs; CPU, Memory, Pods for ECS)

### Services View
- ✅ Real-time service instance data from backend
- ✅ Service summaries fetching
- ✅ Profile-based filtering
- ✅ Environment-based filtering
- ✅ Service actions (start/stop/restart) - integrated with backend

## API Response Format

### InfraDetailDTO (from backend)
```typescript
{
  infraId: number;
  infraType: 'linux' | 'windows' | 'ecs';
  hostname: string;
  ipAddress?: string;
  environment: string;
  region?: string;
  datacenter?: string;
  status?: string;
  projectId?: number;
  projectName?: string;
  vmMetrics?: {
    cpu: { max?: number; used?: number; unit?: string; usagePercentage?: number; };
    memory: { max?: number; used?: number; unit?: string; usagePercentage?: number; };
    disk: { max?: number; used?: number; unit?: string; usagePercentage?: number; };
  };
  ecsMetrics?: {
    cpu: { limitMax?: number; requestMax?: number; used?: number; unit?: string; usagePercentage?: number; };
    memory: { limitMax?: number; requestMax?: number; used?: number; unit?: string; usagePercentage?: number; };
    pods: { max?: number; used?: number; usagePercentage?: number; };
  };
}
```

### ServiceInstanceDTO (from backend)
```typescript
{
  id: string;
  serviceName: string;
  machineName: string;
  infraType: 'linux' | 'windows' | 'ecs';
  profile: string;
  envType?: string;
  version: string;
  logURL: string;
  metricsURL: string;
  port: number;
  uptime: number; // in minutes
  status?: 'running' | 'degraded' | 'restarting' | 'stopped' | 'starting' | 'stopping';
}
```

## Error Handling

The application handles various error scenarios:

1. **Backend Unavailable**: Shows error message with option to retry
2. **Network Errors**: Displays appropriate error message
3. **Invalid Data**: Gracefully handles malformed responses
4. **Loading States**: Shows loading indicators during data fetch

## Performance Optimizations

1. **Caching**: Data is cached for 30 seconds to reduce backend load
2. **Auto-refresh**: Automatic data refresh every 30 seconds
3. **Parallel Requests**: Service instances and summaries are fetched in parallel
4. **Memoization**: Computed values are memoized to prevent unnecessary recalculations

## Troubleshooting

### Backend Connection Issues
- Verify backend server is running on port 8080
- Check CORS configuration allows frontend origin
- Verify `VITE_API_BASE_URL` is set correctly

### Data Not Loading
- Check browser console for error messages
- Verify backend API endpoints are accessible
- Check network tab in developer tools for failed requests

### Build Errors
- Run `npm install` to ensure all dependencies are installed
- Clear build cache: `rm -rf dist node_modules/.vite`
- Rebuild: `npm run build`
