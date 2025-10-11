package com.monitoring.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for service instance information.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceInstanceDTO {
    private String id;
    private String serviceName;
    private String machineName;
    private Integer port;
    private String infraType;
    private String profile;
    private String envType;  // DEV, STAGING, PROD, COB - derived from profile
    private Integer uptime; // in minutes
    private String version;
    private String logURL;
    private String metricsURL;
    private String status;
}
