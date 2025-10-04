package com.monitoring.dashboard.controller;

import com.monitoring.dashboard.dto.CreateDeploymentRequest;
import com.monitoring.dashboard.dto.ServiceDeploymentDTO;
import com.monitoring.dashboard.service.ServiceDeploymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/deployments")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
@RequiredArgsConstructor
@Slf4j
public class ServiceDeploymentController {

    private final ServiceDeploymentService deploymentService;

    @GetMapping
    public ResponseEntity<List<ServiceDeploymentDTO>> getAllDeployments() {
        log.info("GET /api/deployments - Get all deployments");
        return ResponseEntity.ok(deploymentService.getAllDeployments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceDeploymentDTO> getDeploymentById(@PathVariable Long id) {
        log.info("GET /api/deployments/{} - Get deployment by id", id);
        return ResponseEntity.ok(deploymentService.getDeploymentById(id));
    }

    @GetMapping("/infrastructure/{infraId}")
    public ResponseEntity<List<ServiceDeploymentDTO>> getDeploymentsByInfrastructure(@PathVariable Long infraId) {
        log.info("GET /api/deployments/infrastructure/{} - Get deployments by infrastructure", infraId);
        return ResponseEntity.ok(deploymentService.getDeploymentsByInfrastructure(infraId));
    }

    @GetMapping("/service/{serviceId}")
    public ResponseEntity<List<ServiceDeploymentDTO>> getDeploymentsByService(@PathVariable Long serviceId) {
        log.info("GET /api/deployments/service/{} - Get deployments by service", serviceId);
        return ResponseEntity.ok(deploymentService.getDeploymentsByService(serviceId));
    }

    @GetMapping("/profile/{profile}")
    public ResponseEntity<List<ServiceDeploymentDTO>> getDeploymentsByProfile(@PathVariable String profile) {
        log.info("GET /api/deployments/profile/{} - Get deployments by profile", profile);
        return ResponseEntity.ok(deploymentService.getDeploymentsByProfile(profile));
    }

    @PostMapping
    public ResponseEntity<ServiceDeploymentDTO> createDeployment(@Valid @RequestBody CreateDeploymentRequest request) {
        log.info("POST /api/deployments - Create deployment");
        ServiceDeploymentDTO created = deploymentService.createDeployment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServiceDeploymentDTO> updateDeployment(
            @PathVariable Long id,
            @Valid @RequestBody ServiceDeploymentDTO dto) {
        log.info("PUT /api/deployments/{} - Update deployment", id);
        return ResponseEntity.ok(deploymentService.updateDeployment(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDeployment(@PathVariable Long id) {
        log.info("DELETE /api/deployments/{} - Delete deployment", id);
        deploymentService.deleteDeployment(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException ex) {
        log.error("Error in ServiceDeploymentController: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
    }

    record ErrorResponse(String message) {}
}
