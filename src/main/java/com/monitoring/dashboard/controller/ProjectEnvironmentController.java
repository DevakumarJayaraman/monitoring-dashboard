package com.monitoring.dashboard.controller;

import com.monitoring.dashboard.dto.ProjectEnvironmentDTO;
import com.monitoring.dashboard.service.ProjectEnvironmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for managing project environments.
 */
@RestController
@RequestMapping("/api/environments")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Project Environments", description = "APIs for managing project environments and profiles")
public class ProjectEnvironmentController {

    private final ProjectEnvironmentService projectEnvironmentService;

    /**
     * Get all project environments.
     */
    @GetMapping("/getAllEnvironments")
    @Operation(summary = "Get all environments", description = "Retrieves all project environments")
    public ResponseEntity<List<ProjectEnvironmentDTO>> getAllEnvironments() {
        log.info("GET /api/environments/getAllEnvironments - Fetching all environments");
        List<ProjectEnvironmentDTO> environments = projectEnvironmentService.getAllEnvironments();
        log.info("Found {} environments", environments.size());
        return ResponseEntity.ok(environments);
    }

    /**
     * Get environment by ID.
     */
    @GetMapping("/getEnvironmentById/{id}")
    @Operation(summary = "Get environment by ID", description = "Retrieves a specific environment by its ID")
    public ResponseEntity<ProjectEnvironmentDTO> getEnvironmentById(
            @Parameter(description = "Environment ID") @PathVariable Long id) {
        log.info("GET /api/environments/getEnvironmentById/{} - Fetching environment", id);
        ProjectEnvironmentDTO environment = projectEnvironmentService.getEnvironmentById(id);
        return ResponseEntity.ok(environment);
    }

    /**
     * Get environments by project ID.
     */
    @GetMapping("/getProjectMappings/{projectId}")
    @Operation(summary = "Get environments by project", description = "Retrieves all environments for a specific project")
    public ResponseEntity<List<ProjectEnvironmentDTO>> getProjectMappings(
            @Parameter(description = "Project ID") @PathVariable Long projectId) {
        log.info("GET /api/environments/getProjectMappings/{} - Fetching environments", projectId);
        List<ProjectEnvironmentDTO> environments = projectEnvironmentService.getEnvironmentsByProject(projectId);
        log.info("Found {} environments for project {}", environments.size(), projectId);
        return ResponseEntity.ok(environments);
    }

    /**
     * Get environments by environment code.
     */
    @GetMapping("/getEnvironmentsByEnvCode/{envCode}")
    @Operation(summary = "Get environments by code", description = "Retrieves all environments with specific environment code (DEV, UAT, STAGING, PROD, COB)")
    public ResponseEntity<List<ProjectEnvironmentDTO>> getEnvironmentsByEnvCode(
            @Parameter(description = "Environment code (DEV, UAT, STAGING, PROD, COB)") @PathVariable String envCode) {
        log.info("GET /api/environments/getEnvironmentsByEnvCode/{} - Fetching environments", envCode);
        List<ProjectEnvironmentDTO> environments = projectEnvironmentService.getEnvironmentsByEnvCode(envCode);
        log.info("Found {} environments with code {}", environments.size(), envCode);
        return ResponseEntity.ok(environments);
    }

    /**
     * Get environments by region code.
     */
    @GetMapping("/getEnvironmentsByRegion/{regionCode}")
    @Operation(summary = "Get environments by region", description = "Retrieves all environments for a specific region (APAC, EMEA, NAM)")
    public ResponseEntity<List<ProjectEnvironmentDTO>> getEnvironmentsByRegion(
            @Parameter(description = "Region code (APAC, EMEA, NAM)") @PathVariable String regionCode) {
        log.info("GET /api/environments/getEnvironmentsByRegion/{} - Fetching environments", regionCode);
        List<ProjectEnvironmentDTO> environments = projectEnvironmentService.getEnvironmentsByRegion(regionCode);
        log.info("Found {} environments in region {}", environments.size(), regionCode);
        return ResponseEntity.ok(environments);
    }

    /**
     * Get environments by profile code.
     */
    @GetMapping("/getEnvironmentsByProfile/{profileCode}")
    @Operation(summary = "Get environments by profile", description = "Retrieves all environments with specific profile code")
    public ResponseEntity<List<ProjectEnvironmentDTO>> getEnvironmentsByProfile(
            @Parameter(description = "Profile code") @PathVariable String profileCode) {
        log.info("GET /api/environments/getEnvironmentsByProfile/{} - Fetching environments", profileCode);
        List<ProjectEnvironmentDTO> environments = projectEnvironmentService.getEnvironmentsByProfile(profileCode);
        log.info("Found {} environments with profile {}", environments.size(), profileCode);
        return ResponseEntity.ok(environments);
    }

    /**
     * Get all unique profile codes.
     */
    @GetMapping("/getProfiles")
    @Operation(summary = "Get all profiles", description = "Retrieves all unique profile codes from environments")
    public ResponseEntity<List<String>> getProfiles() {
        log.info("GET /api/environments/getProfiles - Fetching all profile codes");
        List<String> profiles = projectEnvironmentService.getAllProfiles();
        log.info("Found {} unique profiles", profiles.size());
        return ResponseEntity.ok(profiles);
    }
}
