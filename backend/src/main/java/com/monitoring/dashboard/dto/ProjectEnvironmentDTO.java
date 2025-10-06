package com.monitoring.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for ProjectEnvironment entity.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectEnvironmentDTO {
    private Long envId;
    private Long projectId;
    private String projectName;
    private String envCode;      // DEV, UAT, STAGING, PROD, COB
    private String regionCode;   // APAC, EMEA, NAM
    private String profileCode;  // apacqa, apacuat, dev, apacprod, etc.
    private String description;
}
