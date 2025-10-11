package com.monitoring.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for Component with its associated service instances
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComponentWithServicesDTO {
    private Long componentId;
    private String componentName;
    private String description;
    private String module;
    private Long projectId;
    private String projectName;
    private Integer serviceInstanceCount;
    private List<ServiceInstanceDTO> serviceInstances;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceInstanceDTO {
        private String instanceId;
        private String serviceName;
        private String machineName;
        private String infraType;
        private String profile;
        private String version;
        private Integer port;
        private Integer uptimeSeconds;
        private String status;
        private String logUrl;
        private String metricsUrl;
    }
}

