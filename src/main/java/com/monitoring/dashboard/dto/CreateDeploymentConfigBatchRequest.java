package com.monitoring.dashboard.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class CreateDeploymentConfigBatchRequest {
    private List<SingleDeploymentConfigRequest> configs;

    @Data
    public static class SingleDeploymentConfigRequest {
        private Long componentId;
        private Long infraId;
        private String profile;
        private Integer basePort;
        // Deployment parameters now include infra-specific settings:
        // For ECS: minPods, maxPods, cpuRequest, cpuLimit, memoryRequest, memoryLimit, targetCpuUtilization
        // For VM: instanceCount, heapSize, threads, jvmOpts, etc.
        private Map<String, String> deployParams;
    }
}
