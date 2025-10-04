package com.monitoring.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InfrastructureDTO {
    
    private Long infraId;
    
    @NotBlank(message = "Infrastructure name is required")
    private String infraName;
    
    @NotBlank(message = "Infrastructure type is required")
    private String infraType;  // ecs/linux/windows/dbaas
    
    private String hostname;
    private String ipAddress;
    
    @NotBlank(message = "Environment is required")
    private String environment;  // DEV/UAT/PROD
    
    private List<ResourceLimitDTO> resourceLimits;
    private List<UsageMetricDTO> currentMetrics;
    private List<ServiceDeploymentDTO> deployedServices;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResourceLimitDTO {
        private Long limitId;
        private String resourceName;
        private String limitValue;
        private String unit;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UsageMetricDTO {
        private Long metricId;
        private String metricName;
        private String metricValue;
        private String unit;
        private String metricTime;
    }
}
