# Backend Schema Alignment - Summary

## What Changed

The backend has been **completely reworked** to align with the normalized database schema defined in `context.MD` (starting at line 117).

## Previous vs New Structure

### ❌ OLD (Denormalized - Deleted)
- `ServiceInstance.java` - Single flat table with all service info
- `Infrastructure.java` - Mixed metrics and infrastructure data
- Simple 1:N relationship between Infrastructure and ServiceInstance

### ✅ NEW (Normalized - Created)

#### 6 New Entity Tables:
1. **`ops_infra`** (`Infrastructure.java`) - Infrastructure master
2. **`infra_resource_limits`** (`InfraResourceLimit.java`) - Capacity limits
3. **`ops_infra_usage_metrics`** (`InfraUsageMetric.java`) - Time-series usage data
4. **`ops_services`** (`Service.java`) - Service catalog
5. **`ops_service_deployments`** (`ServiceDeployment.java`) - Service ↔ Infrastructure mappings
6. **`ops_deployment_configs`** (`DeploymentConfig.java`) - Per-deployment resource configs

#### 6 New Repository Interfaces:
- `InfrastructureRepository.java` (updated)
- `InfraResourceLimitRepository.java`
- `InfraUsageMetricRepository.java`
- `ServiceRepository.java`
- `ServiceDeploymentRepository.java`
- `DeploymentConfigRepository.java`

## Key Improvements

### 1. **Proper Normalization**
- No data duplication
- Clear separation between infrastructure, services, and deployments
- Flexible key-value storage for metrics and configs

### 2. **Time-Series Support**
- Dedicated `ops_infra_usage_metrics` table for tracking usage over time
- Supports both daily aggregation (`metric_date`) and real-time (`metric_time`)

### 3. **Many-to-Many Relationships**
- Services can be deployed to multiple infrastructures
- Each deployment can have a different profile (apacqa, apacuat, etc.)
- Unique constraint: `(service_id, infra_id, profile)`

### 4. **Flexible Configuration**
- Resource limits stored as name-value-unit triplets
- Easy to add new resource types without schema changes
- Example: cpu, memory, disk, threads, heap_size

### 5. **Optimistic Locking**
- All tables use JPA `@Version` for concurrency control
- Prevents lost updates in multi-user scenarios

## Files Structure

```
backend/src/main/java/com/monitoring/dashboard/
├── model/
│   ├── Infrastructure.java          ✅ Updated
│   ├── InfraResourceLimit.java      ✅ New
│   ├── InfraUsageMetric.java        ✅ New
│   ├── Service.java                 ✅ New
│   ├── ServiceDeployment.java       ✅ New
│   └── DeploymentConfig.java        ✅ New
└── repository/
    ├── InfrastructureRepository.java        ✅ Updated
    ├── InfraResourceLimitRepository.java    ✅ New
    ├── InfraUsageMetricRepository.java      ✅ New
    ├── ServiceRepository.java               ✅ New
    ├── ServiceDeploymentRepository.java     ✅ New
    └── DeploymentConfigRepository.java      ✅ New
```

## Deleted Files (Old Schema)
- `ServiceInstance.java`
- `ServiceInstanceRepository.java`
- `ServiceInstanceService.java`
- `InfrastructureService.java`
- `ServiceController.java`
- `InfrastructureController.java`
- `InfrastructureDTO.java`
- `ServiceInstanceDTO.java`
- `CreateServiceRequest.java`
- `DataInitializer.java`

These need to be recreated to work with the new schema.

## Still TODO

### High Priority
1. ✅ Models created
2. ✅ Repositories created
3. ⏳ DTOs for API responses
4. ⏳ Service layer with business logic
5. ⏳ REST Controllers
6. ⏳ Data initializer with sample data
7. ⏳ Update `application.properties`

### Medium Priority
8. Integration tests
9. API documentation (Swagger)
10. Error handling
11. Validation

## How to Use the New Schema

### Example: Add infrastructure with limits
```java
// 1. Create infrastructure
Infrastructure infra = new Infrastructure();
infra.setInfraName("apacqa-vm1");
infra.setInfraType("linux");
infra.setEnvironment("UAT");
infrastructureRepository.save(infra);

// 2. Add resource limits
InfraResourceLimit cpuLimit = new InfraResourceLimit();
cpuLimit.setInfrastructure(infra);
cpuLimit.setResourceName("cpu");
cpuLimit.setLimitValue("4");
cpuLimit.setUnit("vCPU");
infraResourceLimitRepository.save(cpuLimit);

InfraResourceLimit memLimit = new InfraResourceLimit();
memLimit.setInfrastructure(infra);
memLimit.setResourceName("memory");
memLimit.setLimitValue("16");
memLimit.setUnit("GiB");
infraResourceLimitRepository.save(memLimit);
```

### Example: Deploy a service
```java
// 1. Get or create service
Service paymentService = serviceRepository.findByServiceName("payment-service")
    .orElseGet(() -> {
        Service s = new Service();
        s.setServiceName("payment-service");
        s.setOwningTeam("payments-team");
        return serviceRepository.save(s);
    });

// 2. Create deployment mapping
ServiceDeployment deployment = new ServiceDeployment();
deployment.setService(paymentService);
deployment.setInfrastructure(infra);
deployment.setProfile("apacqa");
deployment.setPort(8080);
serviceDeploymentRepository.save(deployment);
```

### Example: Track usage metrics
```java
InfraUsageMetric metric = new InfraUsageMetric();
metric.setInfrastructure(infra);
metric.setMetricName("cpu_usage_pct");
metric.setMetricValue("65.5");
metric.setUnit("%");
metric.setMetricDate(LocalDate.now());
metric.setMetricTime(LocalDateTime.now());
infraUsageMetricRepository.save(metric);
```

## Reference Documentation

See **`SCHEMA_DOCUMENTATION.md`** for:
- Complete SQL table definitions
- Entity relationships diagram
- Repository method examples
- Design principles and benefits

---

**Status**: ✅ Database models and repositories aligned with context.MD
**Next**: Create service layer and REST controllers
