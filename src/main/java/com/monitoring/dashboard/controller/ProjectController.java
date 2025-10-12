package com.monitoring.dashboard.controller;

import com.monitoring.dashboard.dto.ProjectCreateDTO;
import com.monitoring.dashboard.dto.ProjectSummaryDTO;
import com.monitoring.dashboard.dto.ProjectEnvironmentMappingDetailDTO;
import com.monitoring.dashboard.model.Environment;
import com.monitoring.dashboard.model.Project;
import com.monitoring.dashboard.model.Region;
import com.monitoring.dashboard.service.ProjectService;
import com.monitoring.dashboard.repository.EnvironmentRepository;
import com.monitoring.dashboard.repository.RegionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for project-related operations
 */
@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*")
public class ProjectController {

    @Autowired
    private ProjectService projectService;

    @Autowired
    private EnvironmentRepository environmentRepository;

    @Autowired
    private RegionRepository regionRepository;

    /**
     * Get all projects with aggregated statistics
     */
    @GetMapping
    public ResponseEntity<List<ProjectSummaryDTO>> getAllProjects() {
        List<ProjectSummaryDTO> projects = projectService.getAllProjectSummaries();
        return ResponseEntity.ok(projects);
    }

    /**
     * Get a specific project by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProjectSummaryDTO> getProjectById(@PathVariable Long id) {
        // For now, return from the list
        List<ProjectSummaryDTO> projects = projectService.getAllProjectSummaries();
        ProjectSummaryDTO project = projects.stream()
            .filter(p -> p.getId().equals(id))
            .findFirst()
            .orElse(null);
        
        if (project != null) {
            return ResponseEntity.ok(project);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Create a new project
     */
    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody ProjectCreateDTO dto) {
        try {
            Project project = projectService.createProject(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(project);
        } catch (RuntimeException e) {
            // Return validation error message to frontend
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(java.util.Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update an existing project
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProject(@PathVariable Long id, @RequestBody ProjectCreateDTO dto) {
        try {
            Project project = projectService.updateProject(id, dto);
            return ResponseEntity.ok(project);
        } catch (RuntimeException e) {
            // Return validation error message to frontend
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(java.util.Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete a project
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        try {
            projectService.deleteProject(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Retire a project (set active_flag to false)
     * Only allowed if project has no environment mappings
     */
    @PostMapping("/{id}/retire")
    public ResponseEntity<?> retireProject(@PathVariable Long id) {
        try {
            projectService.retireProject(id);
            return ResponseEntity.ok().body(java.util.Map.of("message", "Project retired successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(java.util.Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get environment/region mappings for a specific project
     */
    @GetMapping("/{id}/mappings")
    public ResponseEntity<List<ProjectEnvironmentMappingDetailDTO>> getProjectMappings(@PathVariable Long id) {
        try {
            List<ProjectEnvironmentMappingDetailDTO> mappings = projectService.getProjectMappings(id);
            return ResponseEntity.ok(mappings);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Save a single environment/region mapping for a project
     */
    @PostMapping("/{id}/mappings")
    public ResponseEntity<?> saveMappingForProject(@PathVariable Long id, @RequestBody ProjectCreateDTO.ProjectEnvironmentMappingDTO mappingDTO) {
        try {
            ProjectEnvironmentMappingDetailDTO savedMapping = projectService.saveMappingForProject(id, mappingDTO);
            return ResponseEntity.ok(savedMapping);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(java.util.Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete a single environment/region mapping
     */
    @DeleteMapping("/{projectId}/mappings/{perId}")
    public ResponseEntity<?> deleteMappingForProject(@PathVariable Long projectId, @PathVariable Long perId) {
        try {
            projectService.deleteMappingForProject(projectId, perId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(java.util.Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all environments
     */
    @GetMapping("/metadata/environments")
    public ResponseEntity<List<Environment>> getAllEnvironments() {
        List<Environment> environments = environmentRepository.findAll();
        return ResponseEntity.ok(environments);
    }

    /**
     * Get all regions
     */
    @GetMapping("/metadata/regions")
    public ResponseEntity<List<Region>> getAllRegions() {
        List<Region> regions = regionRepository.findAll();
        return ResponseEntity.ok(regions);
    }
}
