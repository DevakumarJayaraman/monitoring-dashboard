package com.monitoring.dashboard.service;

import com.monitoring.dashboard.dto.ProjectCreateDTO;
import com.monitoring.dashboard.dto.ProjectSummaryDTO;
import com.monitoring.dashboard.dto.ProjectEnvironmentMappingDetailDTO;
import com.monitoring.dashboard.model.*;
import com.monitoring.dashboard.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

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
        // Validate for duplicate environment/region combinations
        validateNoDuplicateMappings(dto.getEnvironmentMappings());

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
        // Validate for duplicate environment/region combinations
        validateNoDuplicateMappings(dto.getEnvironmentMappings());

        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));
        
        project.setProjectName(dto.getProjectName());
        project.setDescription(dto.getDescription());
        if (dto.getActiveFlag() != null) {
            project.setActiveFlag(dto.getActiveFlag());
        }
        
        // Handle mappings intelligently - update existing, add new, remove deleted
        List<ProjectEnvironmentMapping> existingMappings = new ArrayList<>(project.getEnvironmentMappings());
        List<Long> mappingsToKeep = new ArrayList<>();

        if (dto.getEnvironmentMappings() != null) {
            for (ProjectCreateDTO.ProjectEnvironmentMappingDTO mappingDTO : dto.getEnvironmentMappings()) {
                Environment environment = environmentRepository.findById(mappingDTO.getEnvironmentId())
                    .orElseThrow(() -> new RuntimeException("Environment not found: " + mappingDTO.getEnvironmentId()));
                
                Region region = regionRepository.findById(mappingDTO.getRegionId())
                    .orElseThrow(() -> new RuntimeException("Region not found: " + mappingDTO.getRegionId()));
                
                ProjectEnvironmentMapping mapping;

                // Check if this is an existing mapping (has perId) or a new one
                if (mappingDTO.getPerId() != null) {
                    // Find and update existing mapping
                    mapping = existingMappings.stream()
                        .filter(m -> m.getPerId().equals(mappingDTO.getPerId()))
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("Mapping not found: " + mappingDTO.getPerId()));

                    // Validate that env/region hasn't changed (which would violate unique constraint)
                    if (!mapping.getEnvironment().getEnvId().equals(mappingDTO.getEnvironmentId()) ||
                        !mapping.getRegion().getRegionId().equals(mappingDTO.getRegionId())) {
                        throw new RuntimeException("Cannot change environment/region of existing mapping. Delete and create new instead.");
                    }

                    mappingsToKeep.add(mapping.getPerId());

                    // Update profiles for existing mapping
                    mapping.getProfiles().clear();
                } else {
                    // Check if this env/region combination already exists in the database
                    boolean alreadyExists = existingMappings.stream()
                        .anyMatch(m -> m.getEnvironment().getEnvId().equals(mappingDTO.getEnvironmentId()) &&
                                      m.getRegion().getRegionId().equals(mappingDTO.getRegionId()));

                    if (alreadyExists) {
                        throw new RuntimeException("Environment/Region mapping already exists: " +
                            environment.getEnvCode() + " - " + region.getRegionCode());
                    }

                    // Create new mapping
                    mapping = new ProjectEnvironmentMapping();
                    mapping.setProject(project);
                    mapping.setEnvironment(environment);
                    mapping.setRegion(region);
                    mapping.setActiveFlag(true);
                    project.addEnvironmentMapping(mapping);
                }

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
            }
        }

        // Remove mappings that are no longer in the DTO
        existingMappings.stream()
            .filter(m -> !mappingsToKeep.contains(m.getPerId()))
            .forEach(project::removeEnvironmentMapping);

        return projectRepository.save(project);
    }

    /**
     * Validate that there are no duplicate environment/region combinations in the request
     */
    private void validateNoDuplicateMappings(List<ProjectCreateDTO.ProjectEnvironmentMappingDTO> mappings) {
        if (mappings == null || mappings.isEmpty()) {
            return;
        }

        java.util.Set<String> seen = new java.util.HashSet<>();
        for (ProjectCreateDTO.ProjectEnvironmentMappingDTO mapping : mappings) {
            String key = mapping.getEnvironmentId() + "-" + mapping.getRegionId();
            if (!seen.add(key)) {
                // Fetch the environment and region to provide a meaningful error message
                Environment env = environmentRepository.findById(mapping.getEnvironmentId()).orElse(null);
                Region region = regionRepository.findById(mapping.getRegionId()).orElse(null);

                String envName = env != null ? env.getEnvCode() : "Unknown";
                String regionName = region != null ? region.getRegionCode() : "Unknown";

                throw new RuntimeException("Duplicate environment/region mapping detected: " +
                    envName + " - " + regionName);
            }
        }
    }

    /**
     * Delete a project
     */
    @Transactional
    public void deleteProject(Long projectId) {
        projectRepository.deleteById(projectId);
    }

    /**
     * Retire a project (delete it permanently)
     * Only allowed if the project has no environment mappings
     */
    @Transactional
    public void retireProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        // Check if project has any active environment mappings
        long activeMappingsCount = project.getEnvironmentMappings().stream()
            .filter(ProjectEnvironmentMapping::getActiveFlag)
            .count();

        if (activeMappingsCount > 0) {
            throw new RuntimeException(
                String.format("Cannot retire project '%s'. There are %d active environment mapping(s). Please remove all environment mappings before retiring the project.",
                    project.getProjectName(), activeMappingsCount)
            );
        }

        // Delete the project permanently
        projectRepository.deleteById(projectId);
    }

    /**
     * Get environment/region mappings for a specific project (for edit mode)
     */
    public List<ProjectEnvironmentMappingDetailDTO> getProjectMappings(Long projectId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        List<ProjectEnvironmentMappingDetailDTO> mappingDetails = new ArrayList<>();

        for (ProjectEnvironmentMapping mapping : project.getEnvironmentMappings()) {
            if (mapping.getActiveFlag()) {
                ProjectEnvironmentMappingDetailDTO dto = new ProjectEnvironmentMappingDetailDTO();
                dto.setPerId(mapping.getPerId());
                dto.setEnvironmentId((long) mapping.getEnvironment().getEnvId());
                dto.setEnvCode(mapping.getEnvironment().getEnvCode());
                dto.setEnvDesc(mapping.getEnvironment().getEnvDesc());
                dto.setRegionId((long) mapping.getRegion().getRegionId());
                dto.setRegionCode(mapping.getRegion().getRegionCode());
                dto.setRegionDesc(mapping.getRegion().getRegionDesc());
                dto.setActiveFlag(mapping.getActiveFlag());

                // Collect profile codes from the profiles associated with this mapping
                List<String> profileCodes = mapping.getProfiles().stream()
                    .map(ProjectProfiles::getProfileCode)
                    .collect(Collectors.toList());
                dto.setProfileCodes(profileCodes);

                mappingDetails.add(dto);
            }
        }

        return mappingDetails;
    }

    /**
     * Add or update a single environment/region mapping for a project
     */
    @Transactional
    public ProjectEnvironmentMappingDetailDTO saveMappingForProject(Long projectId, ProjectCreateDTO.ProjectEnvironmentMappingDTO mappingDTO) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        Environment environment = environmentRepository.findById(mappingDTO.getEnvironmentId())
            .orElseThrow(() -> new RuntimeException("Environment not found: " + mappingDTO.getEnvironmentId()));

        Region region = regionRepository.findById(mappingDTO.getRegionId())
            .orElseThrow(() -> new RuntimeException("Region not found: " + mappingDTO.getRegionId()));

        ProjectEnvironmentMapping mapping;

        if (mappingDTO.getPerId() != null) {
            // Update existing mapping
            mapping = project.getEnvironmentMappings().stream()
                .filter(m -> m.getPerId().equals(mappingDTO.getPerId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Mapping not found: " + mappingDTO.getPerId()));

            // Validate that env/region hasn't changed
            if (!mapping.getEnvironment().getEnvId().equals(mappingDTO.getEnvironmentId()) ||
                !mapping.getRegion().getRegionId().equals(mappingDTO.getRegionId())) {
                throw new RuntimeException("Cannot change environment/region of existing mapping");
            }

            // Update profiles
            mapping.getProfiles().clear();
        } else {
            // Check if this env/region combination already exists
            boolean alreadyExists = project.getEnvironmentMappings().stream()
                .anyMatch(m -> m.getEnvironment().getEnvId().equals(mappingDTO.getEnvironmentId()) &&
                              m.getRegion().getRegionId().equals(mappingDTO.getRegionId()));

            if (alreadyExists) {
                throw new RuntimeException("Environment/Region mapping already exists: " +
                    environment.getEnvCode() + " - " + region.getRegionCode());
            }

            // Create new mapping
            mapping = new ProjectEnvironmentMapping();
            mapping.setProject(project);
            mapping.setEnvironment(environment);
            mapping.setRegion(region);
            mapping.setActiveFlag(true);
            project.addEnvironmentMapping(mapping);
        }

        // Add profiles
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

        projectRepository.save(project);

        // Return the saved mapping as DTO
        ProjectEnvironmentMappingDetailDTO resultDTO = new ProjectEnvironmentMappingDetailDTO();
        resultDTO.setPerId(mapping.getPerId());
        resultDTO.setEnvironmentId((long) mapping.getEnvironment().getEnvId());
        resultDTO.setEnvCode(mapping.getEnvironment().getEnvCode());
        resultDTO.setEnvDesc(mapping.getEnvironment().getEnvDesc());
        resultDTO.setRegionId((long) mapping.getRegion().getRegionId());
        resultDTO.setRegionCode(mapping.getRegion().getRegionCode());
        resultDTO.setRegionDesc(mapping.getRegion().getRegionDesc());
        resultDTO.setActiveFlag(mapping.getActiveFlag());
        resultDTO.setProfileCodes(mapping.getProfiles().stream()
            .map(ProjectProfiles::getProfileCode)
            .collect(Collectors.toList()));

        return resultDTO;
    }

    /**
     * Delete a single environment/region mapping
     */
    @Transactional
    public void deleteMappingForProject(Long projectId, Long perId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        ProjectEnvironmentMapping mappingToRemove = project.getEnvironmentMappings().stream()
            .filter(m -> m.getPerId().equals(perId))
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Mapping not found: " + perId));

        // Validate: Check if there are any infrastructure items associated with this mapping
        List<Infrastructure> associatedInfra = infrastructureRepository.findByProjectEnvironmentMapping_PerId(perId);
        if (!associatedInfra.isEmpty()) {
            String envCode = mappingToRemove.getEnvironment().getEnvCode();
            String regionCode = mappingToRemove.getRegion().getRegionCode();
            throw new RuntimeException(
                String.format("Cannot delete mapping %s-%s. There are %d infrastructure item(s) associated with this environment/region mapping. Please remove or reassign them first.",
                    envCode, regionCode, associatedInfra.size())
            );
        }

        project.removeEnvironmentMapping(mappingToRemove);
        projectRepository.save(project);
    }
}
