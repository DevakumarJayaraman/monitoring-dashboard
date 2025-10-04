# Monitoring Dashboard Backend

Spring Boot REST API backend for the Infrastructure Monitoring Dashboard application.

## Tech Stack

- **Java 17**
- **Spring Boot 3.2.0**
- **Spring Data JPA** for database access
- **H2 Database** (in-memory for development)
- **PostgreSQL** support for production
- **Lombok** for reducing boilerplate code
- **Jakarta Validation** for request validation
- **Gradle** for build automation

## Architecture

The application follows a layered architecture:

```
Controller → Service → Repository → Entity
   ↓           ↓          ↓           ↓
  REST      Business   Data Access  Database
  API       Logic      Layer        Models
```

### Layers

1. **Controller Layer** (`controller/`): REST endpoints, request/response handling
2. **Service Layer** (`service/`): Business logic, data transformation
3. **Repository Layer** (`repository/`): Data access using Spring Data JPA
4. **Model Layer** (`model/`): JPA entities representing database tables
5. **DTO Layer** (`dto/`): Data Transfer Objects with validation

## Project Structure

```
backend/
├── build.gradle                           # Gradle build configuration
├── settings.gradle                        # Project settings
├── gradlew                               # Gradle wrapper script
├── .gitignore                            # Git ignore patterns
└── src/main/
    ├── java/com/monitoring/dashboard/
    │   ├── MonitoringDashboardApplication.java  # Main Spring Boot class
    │   ├── config/
    │   │   ├── CorsConfig.java           # CORS configuration
    │   │   └── DataInitializer.java      # Sample data seeding
    │   ├── controller/
    │   │   ├── InfrastructureController.java  # Infrastructure REST API
    │   │   └── ServiceController.java         # Services REST API
    │   ├── service/
    │   │   ├── InfrastructureService.java
    │   │   └── ServiceInstanceService.java
    │   ├── repository/
    │   │   ├── InfrastructureRepository.java
    │   │   └── ServiceInstanceRepository.java
    │   ├── model/
    │   │   ├── Infrastructure.java       # Infrastructure entity
    │   │   └── ServiceInstance.java      # Service entity
    │   └── dto/
    │       ├── InfrastructureDTO.java
    │       ├── ServiceInstanceDTO.java
    │       └── CreateServiceRequest.java
    └── resources/
        └── application.properties         # Application configuration
```

## Getting Started

### Prerequisites

- Java 17 or higher
- Gradle (or use included Gradle wrapper)

### Build the Application

```bash
cd backend
./gradlew build
```

### Run the Application

```bash
./gradlew bootRun
```

The application will start on `http://localhost:8080`

### Run with Auto-reload (Development)

Spring Boot DevTools is included, so the application will auto-restart on code changes:

```bash
./gradlew bootRun
```

## Database Configuration

### Development (H2 In-Memory)

The application uses H2 in-memory database by default. Access the H2 console at:
- URL: `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:mem:monitoring_db`
- Username: `sa`
- Password: (leave empty)

### Production (PostgreSQL)

Update `application.properties` for PostgreSQL:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/monitoring_db
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
```

## API Documentation

### Infrastructure Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/infrastructure` | Get all infrastructure with limits & metrics |
| GET | `/api/infrastructure/{id}` | Get infrastructure by ID |
| GET | `/api/infrastructure/name/{name}` | Get infrastructure by name |
| GET | `/api/infrastructure/type/{type}` | Get by type (ecs/linux/windows/dbaas) |
| GET | `/api/infrastructure/environment/{env}` | Get by environment (DEV/UAT/PROD) |
| POST | `/api/infrastructure` | Create new infrastructure |
| PUT | `/api/infrastructure/{id}` | Update infrastructure |
| DELETE | `/api/infrastructure/{id}` | Delete infrastructure |

### Service Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services` | Get all services |
| GET | `/api/services/{id}` | Get service by ID |
| GET | `/api/services/name/{name}` | Get service by name |
| GET | `/api/services/team/{team}` | Get services by owning team |
| POST | `/api/services` | Create new service |
| PUT | `/api/services/{id}` | Update service |
| DELETE | `/api/services/{id}` | Delete service |

### Deployment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/deployments` | Get all service deployments |
| GET | `/api/deployments/{id}` | Get deployment by ID |
| GET | `/api/deployments/infrastructure/{infraId}` | Get deployments on specific infrastructure |
| GET | `/api/deployments/service/{serviceId}` | Get all deployments of a service |
| GET | `/api/deployments/profile/{profile}` | Get deployments by profile |
| POST | `/api/deployments` | Create new deployment |
| PUT | `/api/deployments/{id}` | Update deployment |
| DELETE | `/api/deployments/{id}` | Delete deployment |

### Example Requests

#### Create Infrastructure with Resource Limits

```bash
curl -X POST http://localhost:8080/api/infrastructure \
  -H "Content-Type: application/json" \
  -d '{
    "infraName": "new-vm-01",
    "infraType": "linux",
    "hostname": "new-vm-01.local",
    "ipAddress": "10.0.1.50",
    "environment": "DEV",
    "resourceLimits": [
      {"resourceName": "cpu", "limitValue": "4", "unit": "vCPU"},
      {"resourceName": "memory", "limitValue": "16", "unit": "GiB"},
      {"resourceName": "disk", "limitValue": "100", "unit": "GiB"}
    ]
  }'
```

#### Get All Infrastructure

```bash
curl http://localhost:8080/api/infrastructure
```

#### Get Infrastructure by Type

```bash
curl http://localhost:8080/api/infrastructure/type/linux
```

#### Create Service

```bash
curl -X POST http://localhost:8080/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "new-payment-service",
    "description": "New payment processing service",
    "owningTeam": "Payments Team"
  }'
```

#### Create Deployment

```bash
curl -X POST http://localhost:8080/api/deployments \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": 1,
    "infraName": "apacqa-vm1",
    "profile": "apacqa",
    "port": 8080
  }'
```

#### Get Deployments on Infrastructure

```bash
curl http://localhost:8080/api/deployments/infrastructure/1
```

## Data Models

### Infrastructure Response

```json
{
  "infraId": 1,
  "infraName": "apacqa-vm1",
  "infraType": "linux",
  "hostname": "192.168.1.10",
  "ipAddress": "10.0.1.10",
  "environment": "UAT",
  "resourceLimits": [
    {"limitId": 1, "resourceName": "cpu", "limitValue": "4.0", "unit": "vCPU"},
    {"limitId": 2, "resourceName": "memory", "limitValue": "16.0", "unit": "GiB"},
    {"limitId": 3, "resourceName": "disk", "limitValue": "100.0", "unit": "GiB"}
  ],
  "currentMetrics": [
    {"metricId": 1, "metricName": "cpu_usage", "metricValue": "2.4", "unit": "cores", "metricTime": "2025-10-03T10:30:00"},
    {"metricId": 2, "metricName": "cpu_usage_pct", "metricValue": "60.0", "unit": "%", "metricTime": "2025-10-03T10:30:00"},
    {"metricId": 3, "metricName": "memory_usage", "metricValue": "8.1", "unit": "GiB", "metricTime": "2025-10-03T10:30:00"}
  ]
}
```

### Service Response

```json
{
  "serviceId": 1,
  "serviceName": "payment-service",
  "description": "Handles payment processing",
  "owningTeam": "Payments Team",
  "totalDeployments": 4
}
```

### Deployment Response

```json
{
  "mappingId": 1,
  "serviceId": 1,
  "serviceName": "payment-service",
  "infraId": 1,
  "infraName": "apacqa-vm1",
  "infraType": "linux",
  "profile": "apacqa",
  "port": 8080
}
```

## CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:5173` (Vite default)
- `http://localhost:5174` (Vite alternate)

Modify `CorsConfig.java` to add additional origins.

## Sample Data

On startup, the application automatically seeds the database with sample data:
- **6 infrastructure instances**: apacqa-vm1, apacqa-vm2, apacuat-vm1, prod-ecs-cluster-1, prod-win-vm1, dev-linux-vm1
- **5 services**: payment-service, auth-service, trade-service, risk-service, report-service
- **13 deployments** across different profiles (apacqa, apacuat, prod, dev)
- **Resource limits** (cpu, memory, disk) for each infrastructure
- **Usage metrics** (cpu, memory, disk with percentages) for real-time monitoring

Sample infrastructure types:
- `linux` - Linux VMs
- `windows` - Windows VMs  
- `ecs` - AWS ECS clusters
- `dbaas` - Database as a Service (can be added)

Sample environments:
- `DEV` - Development
- `UAT` - User Acceptance Testing
- `PROD` - Production

This happens only if the database is empty. To reset data, just restart the application (H2 in-memory resets on restart).

## Development Tips

### Enable SQL Logging

Already enabled in `application.properties`:
```properties
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE
```

### Clean Build

```bash
./gradlew clean build
```

### Run Tests

```bash
./gradlew test
```

### Build JAR

```bash
./gradlew bootJar
```

The JAR file will be in `build/libs/monitoring-dashboard-backend-0.0.1-SNAPSHOT.jar`

### Run JAR

```bash
java -jar build/libs/monitoring-dashboard-backend-0.0.1-SNAPSHOT.jar
```

## Frontend Integration

Update the frontend to call these APIs instead of using mock data.

Example fetch call:

```typescript
// Fetch all infrastructure
const response = await fetch('http://localhost:8080/api/infrastructure');
const infrastructure = await response.json();

// Create new infrastructure
const response = await fetch('http://localhost:8080/api/infrastructure', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(infrastructureData)
});
```

## Troubleshooting

### Port 8080 Already in Use

Change the port in `application.properties`:
```properties
server.port=8081
```

### Database Connection Issues

Check the H2 console at `http://localhost:8080/h2-console` to verify database connection.

### CORS Issues

Verify the frontend origin is listed in `CorsConfig.java`:
```java
config.setAllowedOrigins(Arrays.asList(
    "http://localhost:5173",
    "http://localhost:5174"
));
```

## Next Steps

1. **Testing**: Add unit and integration tests
2. **Security**: Add Spring Security for authentication/authorization
3. **API Documentation**: Add Swagger/OpenAPI documentation
4. **Metrics**: Add Actuator endpoints for monitoring
5. **Logging**: Configure centralized logging
6. **Docker**: Create Dockerfile for containerization
7. **CI/CD**: Set up GitHub Actions or Jenkins pipeline

## License

This project is part of the Monitoring Dashboard application.
