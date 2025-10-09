package com.monitoring.dashboard.controller;

import com.monitoring.dashboard.dto.ProjectSummaryDTO;
import com.monitoring.dashboard.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
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
}
