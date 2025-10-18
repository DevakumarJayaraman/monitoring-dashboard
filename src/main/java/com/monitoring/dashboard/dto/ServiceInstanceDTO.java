package com.monitoring.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for service instance information.
 * Instances are created based on deployment configs,
 * with runtime data populated by agents.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceInstanceDTO {
    private String id;
    private Long configId;
    private String serviceName;
    private String machineName;
    private Integer port;
    private String infraType;
    private String profile;
    private String envType;  // DEV, STAGING, PROD, COB - derived from profile

    // Runtime data populated by agents
    private Integer uptime; // in minutes
    private String version;
    private String status;
    private LocalDateTime deployedAt;
    private LocalDateTime lastUpdated;

    // Generated URLs for logs and metrics
    private String logURL;
    private String metricsURL;
}
