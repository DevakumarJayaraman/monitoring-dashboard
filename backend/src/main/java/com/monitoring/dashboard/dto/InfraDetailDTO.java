package com.monitoring.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Detailed DTO for infrastructure with comprehensive metrics.
 * Supports both VM (linux/windows) and ECS metrics.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InfraDetailDTO {
    
    private Long infraId;
    private String infraType;  // linux, windows, ecs
    private String hostname;
    private String ipAddress;
    private String environment;
    private String region;
    private String datacenter;
    private String status;
    private Long projectId;
    private String projectName;
    
    // Metrics based on infrastructure type
    private VmMetrics vmMetrics;      // For linux/windows
    private EcsMetrics ecsMetrics;    // For ecs
    
    /**
     * VM Metrics for Linux/Windows infrastructure.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VmMetrics {
        private MetricDetail cpu;
        private MetricDetail memory;
        private MetricDetail disk;
    }
    
    /**
     * ECS Metrics for container infrastructure.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EcsMetrics {
        private EcsResourceMetric cpu;
        private EcsResourceMetric memory;
        private PodMetric pods;
    }
    
    /**
     * Generic metric with max and used values.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetricDetail {
        private Double max;
        private Double used;
        private String unit;
        private Double usagePercentage;  // Calculated as (used/max) * 100
    }
    
    /**
     * ECS-specific metric with limit, request, and used values.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EcsResourceMetric {
        private Double limitMax;
        private Double requestMax;
        private Double used;
        private String unit;
        private Double usagePercentage;  // Calculated as (used/limitMax) * 100
    }
    
    /**
     * Pod metric for ECS.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PodMetric {
        private Integer max;
        private Integer used;
        private Double usagePercentage;  // Calculated as (used/max) * 100
    }
}
