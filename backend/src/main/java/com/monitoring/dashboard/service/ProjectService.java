package com.monitoring.dashboard.service;

import com.monitoring.dashboard.dto.ProjectSummaryDTO;
import com.monitoring.dashboard.model.Infrastructure;
import com.monitoring.dashboard.model.Project;
import com.monitoring.dashboard.repository.InfrastructureRepository;
import com.monitoring.dashboard.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for managing projects and aggregating their statistics
 */
@Service
@Transactional(readOnly = true)
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private InfrastructureRepository infrastructureRepository;

    /**
     * Get all projects from ops_projects table with infrastructure breakdown by environment and type
     */
    public List<ProjectSummaryDTO> getAllProjectSummaries() {
        List<Project> projects = projectRepository.findAll();
        List<ProjectSummaryDTO> summaries = new ArrayList<>();

        for (Project project : projects) {
            ProjectSummaryDTO summary = new ProjectSummaryDTO();
            summary.setId(project.getProjectId());
            summary.setName(project.getProjectName());
            summary.setDescription(project.getDescription());
            
            // Get infrastructure for this project through the repository
            List<Infrastructure> infrastructures = infrastructureRepository
                .findByProjectEnvironmentMapping_Project_ProjectId(project.getProjectId());

            // Count total infrastructure
            summary.setTotalInfrastructure(infrastructures.size());

            // Count total services (components)
            summary.setTotalServices(project.getComponents().size());
            
            // Build infrastructure breakdown by environment and type
            // Map structure: { "DEV": { "linux": 5, "windows": 3, "ecs": 2 }, "UAT": {...}, ... }
            java.util.Map<String, java.util.Map<String, Integer>> infraByEnv = new java.util.HashMap<>();
            
            for (Infrastructure infra : infrastructures) {
                String env = infra.getEnvironment(); // DEV, STAGING, PROD, COB
                String type = infra.getInfraType(); // linux, windows, ecs
                
                // Map STAGING to UAT for display
                if ("STAGING".equals(env)) {
                    env = "UAT";
                }
                
                infraByEnv.putIfAbsent(env, new java.util.HashMap<>());
                java.util.Map<String, Integer> typeMap = infraByEnv.get(env);
                typeMap.put(type, typeMap.getOrDefault(type, 0) + 1);
            }
            
            summary.setInfrastructureByEnv(infraByEnv);
            
            // Overall health status
            String healthStatus = "healthy";
            long criticalCount = 0;
            long warningCount = 0;
            
            for (Infrastructure infra : infrastructures) {
                if ("critical".equals(infra.getStatus()) || "down".equals(infra.getStatus())) {
                    criticalCount++;
                } else if ("scaling".equals(infra.getStatus()) || "watch".equals(infra.getStatus())) {
                    warningCount++;
                }
            }
            
            if (criticalCount > 0) {
                healthStatus = "critical";
            } else if (warningCount > 0) {
                healthStatus = "warning";
            }
            
            summary.setHealthStatus(healthStatus);
            summary.setLastUpdated(LocalDateTime.now());
            
            summaries.add(summary);
        }

        return summaries;
    }

    /**
     * Get a specific project by ID
     */
    public Project getProjectById(Long projectId) {
        return projectRepository.findById(projectId).orElse(null);
    }

    /**
     * Get all projects
     */
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }
}
