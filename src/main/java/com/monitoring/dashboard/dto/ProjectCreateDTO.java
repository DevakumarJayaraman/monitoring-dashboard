package com.monitoring.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * DTO for creating a new project with environment/region mappings and profiles
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectCreateDTO {
    private String projectName;
    private String description;
    private Boolean activeFlag = true;
    
    // List of environment/region mappings with profiles
    private List<ProjectEnvironmentMappingDTO> environmentMappings = new ArrayList<>();
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectEnvironmentMappingDTO {
        private Long perId; // Include for updates to existing mappings
        private Integer environmentId;
        private Integer regionId;
        private List<String> profileCodes = new ArrayList<>(); // e.g., ["apacqa", "emeaqa"]
    }
}
