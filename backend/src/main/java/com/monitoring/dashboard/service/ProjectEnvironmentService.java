package com.monitoring.dashboard.service;

import com.monitoring.dashboard.dto.ProjectEnvironmentDTO;
import com.monitoring.dashboard.model.ProjectEnvironment;
import com.monitoring.dashboard.repository.ProjectEnvironmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service layer for managing project environments.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectEnvironmentService {

    private final ProjectEnvironmentRepository projectEnvironmentRepository;

    /**
     * Get all project environments.
     */
    @Transactional(readOnly = true)
    public List<ProjectEnvironmentDTO> getAllEnvironments() {
        return projectEnvironmentRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get environment by ID.
     */
    @Transactional(readOnly = true)
    public ProjectEnvironmentDTO getEnvironmentById(Long id) {
        ProjectEnvironment env = projectEnvironmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Environment not found with id: " + id));
        return convertToDTO(env);
    }

    /**
     * Get all environments for a specific project.
     */
    @Transactional(readOnly = true)
    public List<ProjectEnvironmentDTO> getEnvironmentsByProject(Long projectId) {
        return projectEnvironmentRepository.findByProjectId(projectId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get environments by environment code (DEV, UAT, STAGING, PROD, COB).
     */
    @Transactional(readOnly = true)
    public List<ProjectEnvironmentDTO> getEnvironmentsByEnvCode(String envCode) {
        return projectEnvironmentRepository.findByEnvCode(envCode).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get environments by region code (APAC, EMEA, NAM).
     */
    @Transactional(readOnly = true)
    public List<ProjectEnvironmentDTO> getEnvironmentsByRegion(String regionCode) {
        return projectEnvironmentRepository.findByRegionCode(regionCode).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get environments by profile code.
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
                .map(ProjectEnvironment::getProfileCode)
                .filter(profile -> profile != null && !profile.isEmpty())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    /**
     * Convert ProjectEnvironment entity to DTO.
     */
    private ProjectEnvironmentDTO convertToDTO(ProjectEnvironment env) {
        ProjectEnvironmentDTO dto = new ProjectEnvironmentDTO();
        dto.setEnvId(env.getEnvId());
        dto.setEnvCode(env.getEnvCode());
        dto.setRegionCode(env.getRegionCode());
        dto.setProfileCode(env.getProfileCode());
        dto.setDescription(env.getDescription());
        
        if (env.getProject() != null) {
            dto.setProjectId(env.getProject().getProjectId());
            dto.setProjectName(env.getProject().getProjectName());
        }
        
        return dto;
    }
}
