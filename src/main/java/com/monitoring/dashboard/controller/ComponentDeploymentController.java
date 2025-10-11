package com.monitoring.dashboard.controller;

import com.monitoring.dashboard.dto.ComponentDeploymentDTO;
import com.monitoring.dashboard.dto.CreateComponentDeploymentBatchRequest;
import com.monitoring.dashboard.service.ComponentDeploymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/component-deployments")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Component Deployments", description = "APIs for managing service deployment mappings")
public class ComponentDeploymentController {

    private final ComponentDeploymentService componentDeploymentService;

    @GetMapping("/project/{projectId}")
    @Operation(summary = "Get deployments by project", description = "Retrieve all component deployments for a given project")
    public ResponseEntity<List<ComponentDeploymentDTO>> getDeploymentsByProject(@PathVariable Long projectId) {
        log.info("GET /api/component-deployments/project/{} - fetching component deployments", projectId);
        return ResponseEntity.ok(componentDeploymentService.getDeploymentsByProject(projectId));
    }

    @PostMapping("/batch")
    @Operation(summary = "Create deployments", description = "Create multiple component deployment mappings in a single request")
    public ResponseEntity<List<ComponentDeploymentDTO>> createDeployments(
            @Valid @RequestBody CreateComponentDeploymentBatchRequest request) {
        log.info("POST /api/component-deployments/batch - creating {} deployments", request.getDeployments().size());
        List<ComponentDeploymentDTO> created = componentDeploymentService.createDeployments(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
