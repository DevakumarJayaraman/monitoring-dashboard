package com.monitoring.dashboard.service;

import com.monitoring.dashboard.dto.ProjectCreateDTO;
import com.monitoring.dashboard.dto.ProjectSummaryDTO;
import com.monitoring.dashboard.model.*;
import com.monitoring.dashboard.repository.*;
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

    @Autowired
    private EnvironmentRepository environmentRepository;

    @Autowired
    private RegionRepository regionRepository;

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

    /**
     * Create a new project with environment/region mappings and profiles
     */
    @Transactional
    public Project createProject(ProjectCreateDTO dto) {
        // Create the project
        Project project = new Project();
        project.setProjectName(dto.getProjectName());
        project.setDescription(dto.getDescription());
        project.setActiveFlag(dto.getActiveFlag() != null ? dto.getActiveFlag() : true);
        
        // Save the project first to get the ID
        project = projectRepository.save(project);
        
        // Create environment/region mappings with profiles
        if (dto.getEnvironmentMappings() != null) {
            for (ProjectCreateDTO.ProjectEnvironmentMappingDTO mappingDTO : dto.getEnvironmentMappings()) {
                Environment environment = environmentRepository.findById(mappingDTO.getEnvironmentId())
                    .orElseThrow(() -> new RuntimeException("Environment not found: " + mappingDTO.getEnvironmentId()));
                
                Region region = regionRepository.findById(mappingDTO.getRegionId())
                    .orElseThrow(() -> new RuntimeException("Region not found: " + mappingDTO.getRegionId()));
                
                // Create the mapping
                ProjectEnvironmentMapping mapping = new ProjectEnvironmentMapping();
                mapping.setProject(project);
                mapping.setEnvironment(environment);
                mapping.setRegion(region);
                mapping.setActiveFlag(true);
                
                // Add profiles to the mapping
                if (mappingDTO.getProfileCodes() != null) {
                    for (String profileCode : mappingDTO.getProfileCodes()) {
                        ProjectProfiles profile = new ProjectProfiles();
                        profile.setProjectEnvironmentMapping(mapping);
                        profile.setProfileCode(profileCode);
                        profile.setProfileDesc("Profile for " + environment.getEnvCode() + " - " + region.getRegionCode());
                        profile.setStatus("ACTIVE");
                        mapping.addProfile(profile);
                    }
                }
                
                project.addEnvironmentMapping(mapping);
            }
        }
        
        return projectRepository.save(project);
    }

    /**
     * Update an existing project
     */
    @Transactional
    public Project updateProject(Long projectId, ProjectCreateDTO dto) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));
        
        project.setProjectName(dto.getProjectName());
        project.setDescription(dto.getDescription());
        if (dto.getActiveFlag() != null) {
            project.setActiveFlag(dto.getActiveFlag());
        }
        
        // Clear existing mappings
        project.getEnvironmentMappings().clear();
        
        // Add new mappings
        if (dto.getEnvironmentMappings() != null) {
            for (ProjectCreateDTO.ProjectEnvironmentMappingDTO mappingDTO : dto.getEnvironmentMappings()) {
                Environment environment = environmentRepository.findById(mappingDTO.getEnvironmentId())
                    .orElseThrow(() -> new RuntimeException("Environment not found: " + mappingDTO.getEnvironmentId()));
                
                Region region = regionRepository.findById(mappingDTO.getRegionId())
                    .orElseThrow(() -> new RuntimeException("Region not found: " + mappingDTO.getRegionId()));
                
                ProjectEnvironmentMapping mapping = new ProjectEnvironmentMapping();
                mapping.setProject(project);
                mapping.setEnvironment(environment);
                mapping.setRegion(region);
                mapping.setActiveFlag(true);
                
                if (mappingDTO.getProfileCodes() != null) {
                    for (String profileCode : mappingDTO.getProfileCodes()) {
                        ProjectProfiles profile = new ProjectProfiles();
                        profile.setProjectEnvironmentMapping(mapping);
                        profile.setProfileCode(profileCode);
                        profile.setProfileDesc("Profile for " + environment.getEnvCode() + " - " + region.getRegionCode());
                        profile.setStatus("ACTIVE");
                        mapping.addProfile(profile);
                    }
                }
                
                project.addEnvironmentMapping(mapping);
            }
        }
        
        return projectRepository.save(project);
    }

    /**
     * Delete a project
     */
    @Transactional
    public void deleteProject(Long projectId) {
        projectRepository.deleteById(projectId);
    }
}
