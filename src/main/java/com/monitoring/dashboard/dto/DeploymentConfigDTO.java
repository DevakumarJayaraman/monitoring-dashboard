package com.monitoring.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeploymentConfigDTO {
    
    private Long configId;

    @NotNull(message = "Component ID is required")
    private Long componentId;

    @NotNull(message = "Infrastructure ID is required")
    private Long infraId;

    @NotBlank(message = "Profile is required")
    private String profile;
    
    private Integer basePort;

    // Deployment parameters as key/value map (will be serialized to BLOB)
    // For ECS: minPods, maxPods, cpuRequest, cpuLimit, memoryRequest, memoryLimit, targetCpuUtilization
    // For VM (Linux/Windows): instanceCount, heapSize, threads, jvmOpts, etc.
    private Map<String, String> deployParams;

    private Boolean enabled;

    private Long version;
}
