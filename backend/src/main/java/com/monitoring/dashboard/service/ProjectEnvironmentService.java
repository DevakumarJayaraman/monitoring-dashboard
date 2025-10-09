package com.monitoring.dashboard.service;

import com.monitoring.dashboard.dto.ProjectEnvironmentDTO;
import com.monitoring.dashboard.model.Environment;
import com.monitoring.dashboard.model.Project;
import com.monitoring.dashboard.model.ProjectProfiles;
import com.monitoring.dashboard.model.ProjectEnvironmentMapping;
import com.monitoring.dashboard.model.Region;
import com.monitoring.dashboard.repository.ProjectEnvironmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service layer for managing project environments and profiles.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectEnvironmentService {

    private final ProjectEnvironmentRepository projectEnvironmentRepository;

    /**
     * Get all project environment profiles.
     */
    @Transactional(readOnly = true)
    public List<ProjectEnvironmentDTO> getAllEnvironments() {
        return projectEnvironmentRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get environment profile by ID.
     */
    @Transactional(readOnly = true)
    public ProjectEnvironmentDTO getEnvironmentById(Long id) {
        ProjectProfiles env = projectEnvironmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Environment profile not found with id: " + id));
        return convertToDTO(env);
    }

    /**
     * Get all environment profiles for a specific project.
     */
    @Transactional(readOnly = true)
    public List<ProjectEnvironmentDTO> getEnvironmentsByProject(Long projectId) {
        return projectEnvironmentRepository.findByProjectEnvironmentMappingProjectProjectId(projectId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get environment profiles by environment code (DEV, STAGING, PROD, COB).
     */
    @Transactional(readOnly = true)
    public List<ProjectEnvironmentDTO> getEnvironmentsByEnvCode(String envCode) {
        return projectEnvironmentRepository.findByProjectEnvironmentMappingEnvironmentEnvCode(envCode).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get environment profiles by region code (APAC, EMEA, NAM, etc.).
     */
    @Transactional(readOnly = true)
    public List<ProjectEnvironmentDTO> getEnvironmentsByRegion(String regionCode) {
        return projectEnvironmentRepository.findByProjectEnvironmentMappingRegionRegionCode(regionCode).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get environment profiles by profile code.
     */
    @Transactional(readOnly = true)
    public List<ProjectEnvironmentDTO> getEnvironmentsByProfile(String profileCode) {
        return projectEnvironmentRepository.findByProfileCode(profileCode).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all unique profile codes.
     */
    @Transactional(readOnly = true)
    public List<String> getAllProfiles() {
        return projectEnvironmentRepository.findAll().stream()
                .map(ProjectProfiles::getProfileCode)
                .filter(profile -> profile != null && !profile.isEmpty())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    /**
     * Convert ProjectProfiles entity to DTO.
     */
    private ProjectEnvironmentDTO convertToDTO(ProjectProfiles profile) {
        ProjectEnvironmentDTO dto = new ProjectEnvironmentDTO();
        dto.setProfileId(profile.getProfileId());
        dto.setProfileCode(profile.getProfileCode());
        dto.setProfileDescription(profile.getProfileDesc());
        dto.setStatus(profile.getStatus());
        dto.setProfileCreatedAt(profile.getCreatedAt());

        ProjectEnvironmentMapping mapping = profile.getProjectEnvironmentMapping();
        if (mapping != null) {
            dto.setPerId(mapping.getPerId());
            dto.setActiveFlag(mapping.getActiveFlag());
            dto.setMappingCreatedAt(mapping.getCreatedAt());

            Project project = mapping.getProject();
            if (project != null) {
                dto.setProjectId(project.getProjectId());
                dto.setProjectName(project.getProjectName());
            }

            Environment environment = mapping.getEnvironment();
            if (environment != null) {
                dto.setEnvironmentId(environment.getEnvId());
                dto.setEnvCode(environment.getEnvCode());
                dto.setEnvironmentDescription(environment.getEnvDesc());
            }

            Region region = mapping.getRegion();
            if (region != null) {
                dto.setRegionId(region.getRegionId());
                dto.setRegionCode(region.getRegionCode());
                dto.setRegionDescription(region.getRegionDesc());
            }
        }

        return dto;
    }
}
