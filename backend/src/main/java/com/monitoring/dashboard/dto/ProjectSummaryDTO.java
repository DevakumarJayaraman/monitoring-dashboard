package com.monitoring.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * DTO for project summary with aggregated statistics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectSummaryDTO {
    private Long id;
    private String name;
    private String description;
    private Integer totalServices;
    private Integer totalInfrastructure;
    private String healthStatus;
    private LocalDateTime lastUpdated;
    
    // Infrastructure breakdown by environment and type
    // Map structure: { "DEV": { "linux": 5, "windows": 3, "ecs": 2 }, "UAT": {...}, ... }
    private Map<String, Map<String, Integer>> infrastructureByEnv;
}
