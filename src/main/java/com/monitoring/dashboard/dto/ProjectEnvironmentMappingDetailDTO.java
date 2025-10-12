package com.monitoring.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for returning project environment/region mapping details (for edit mode)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectEnvironmentMappingDetailDTO {
    private Long perId;
    private Long environmentId;
    private String envCode;
    private String envDesc;
    private Long regionId;
    private String regionCode;
    private String regionDesc;
    private List<String> profileCodes;
    private Boolean activeFlag;
}

