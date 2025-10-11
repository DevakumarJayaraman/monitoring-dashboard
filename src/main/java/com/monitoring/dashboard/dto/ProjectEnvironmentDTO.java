package com.monitoring.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO aggregating project, environment, region, and profile details.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectEnvironmentDTO {
    private Long profileId;
    private Long projectId;
    private String projectName;
    private Integer environmentId;
    private String envCode;
    private String environmentDescription;
    private Integer regionId;
    private String regionCode;
    private String regionDescription;
    private Long perId;
    private Boolean activeFlag;
    private LocalDateTime mappingCreatedAt;
    private String profileCode;
    private String profileDescription;
    private String status;
    private LocalDateTime profileCreatedAt;
}
