package com.monitoring.dashboard.controller;

import com.monitoring.dashboard.dto.ServiceActionRequest;
import com.monitoring.dashboard.dto.ServiceActionResponse;
import com.monitoring.dashboard.dto.ServiceInstanceDTO;
import com.monitoring.dashboard.service.ServiceInstanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for managing service instances.
 * Provides endpoints for querying and managing service deployments.
 */
@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Service Instances", description = "APIs for managing service instances and deployments")
public class ServiceInstanceController {

    private final ServiceInstanceService serviceInstanceService;

    /**
     * Get all service instances.
     */
    @GetMapping("/instances")
    @Operation(summary = "Get all service instances", description = "Retrieves all deployed service instances across all environments")
    public ResponseEntity<List<ServiceInstanceDTO>> getAllServiceInstances() {
        log.info("GET /api/services/instances - Fetching all service instances");
        List<ServiceInstanceDTO> instances = serviceInstanceService.getAllServiceInstances();
        log.info("Found {} service instances", instances.size());
        return ResponseEntity.ok(instances);
    }

    /**
     * Get service instance by ID.
     */
    @GetMapping("/instances/{id}")
    @Operation(summary = "Get service instance by ID", description = "Retrieves a specific service instance by its unique identifier")
    public ResponseEntity<ServiceInstanceDTO> getServiceInstanceById(
            @Parameter(description = "Service instance ID") @PathVariable String id) {
        log.info("GET /api/services/instances/{} - Fetching service instance", id);
        ServiceInstanceDTO instance = serviceInstanceService.getServiceInstanceById(id);
        return ResponseEntity.ok(instance);
    }

    /**
     * Get service instances by service name.
     */
    @GetMapping("/instances/name/{serviceName}")
    @Operation(summary = "Get service instances by name", description = "Retrieves all instances of a specific service")
    public ResponseEntity<List<ServiceInstanceDTO>> getServiceInstancesByName(
            @Parameter(description = "Service name") @PathVariable String serviceName) {
        log.info("GET /api/services/instances/name/{} - Fetching instances", serviceName);
        List<ServiceInstanceDTO> instances = serviceInstanceService.getServiceInstancesByName(serviceName);
        log.info("Found {} instances of service {}", instances.size(), serviceName);
        return ResponseEntity.ok(instances);
    }

    /**
     * Get service instances by profile.
     */
    @GetMapping("/instances/profile/{profile}")
    @Operation(summary = "Get service instances by profile", description = "Retrieves all service instances for a specific profile (e.g., apacqa, emeauat)")
    public ResponseEntity<List<ServiceInstanceDTO>> getServiceInstancesByProfile(
            @Parameter(description = "Profile name (e.g., apacqa, emeauat)") @PathVariable String profile) {
        log.info("GET /api/services/instances/profile/{} - Fetching instances", profile);
        List<ServiceInstanceDTO> instances = serviceInstanceService.getServiceInstancesByProfile(profile);
        log.info("Found {} instances for profile {}", instances.size(), profile);
        return ResponseEntity.ok(instances);
    }

    /**
     * Get service instances by machine name.
     */
    @GetMapping("/instances/machine/{machineName}")
    @Operation(summary = "Get service instances by machine", description = "Retrieves all service instances running on a specific machine")
    public ResponseEntity<List<ServiceInstanceDTO>> getServiceInstancesByMachine(
            @Parameter(description = "Machine name") @PathVariable String machineName) {
        log.info("GET /api/services/instances/machine/{} - Fetching instances", machineName);
        List<ServiceInstanceDTO> instances = serviceInstanceService.getServiceInstancesByMachine(machineName);
        log.info("Found {} instances on machine {}", instances.size(), machineName);
        return ResponseEntity.ok(instances);
    }

    /**
     * Get service instances by infra type.
     */
    @GetMapping("/instances/type/{infraType}")
    @Operation(summary = "Get service instances by infrastructure type", description = "Retrieves all service instances by infrastructure type (linux, windows, ecs)")
    public ResponseEntity<List<ServiceInstanceDTO>> getServiceInstancesByInfraType(
            @Parameter(description = "Infrastructure type (linux, windows, ecs)") @PathVariable String infraType) {
        log.info("GET /api/services/instances/type/{} - Fetching instances", infraType);
        List<ServiceInstanceDTO> instances = serviceInstanceService.getServiceInstancesByInfraType(infraType);
        log.info("Found {} instances on {} infrastructure", instances.size(), infraType);
        return ResponseEntity.ok(instances);
    }

    /**
     * Get service instances by status.
     */
    @GetMapping("/instances/status/{status}")
    @Operation(summary = "Get service instances by status", description = "Retrieves all service instances with a specific status")
    public ResponseEntity<List<ServiceInstanceDTO>> getServiceInstancesByStatus(
            @Parameter(description = "Status (running, degraded, restarting)") @PathVariable String status) {
        log.info("GET /api/services/instances/status/{} - Fetching instances", status);
        List<ServiceInstanceDTO> instances = serviceInstanceService.getServiceInstancesByStatus(status);
        log.info("Found {} instances with status {}", instances.size(), status);
        return ResponseEntity.ok(instances);
    }

    /**
     * Create a new service instance.
     */
    @PostMapping("/instances")
    @Operation(summary = "Create service instance", description = "Creates a new service instance deployment")
    public ResponseEntity<ServiceInstanceDTO> createServiceInstance(
            @RequestBody ServiceInstanceDTO dto) {
        log.info("POST /api/services/instances - Creating service instance: {}", dto.getServiceName());
        ServiceInstanceDTO created = serviceInstanceService.createServiceInstance(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Update an existing service instance.
     */
    @PutMapping("/instances/{id}")
    @Operation(summary = "Update service instance", description = "Updates an existing service instance")
    public ResponseEntity<ServiceInstanceDTO> updateServiceInstance(
            @Parameter(description = "Service instance ID") @PathVariable String id,
            @RequestBody ServiceInstanceDTO dto) {
        log.info("PUT /api/services/instances/{} - Updating service instance", id);
        ServiceInstanceDTO updated = serviceInstanceService.updateServiceInstance(id, dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete a service instance.
     */
    @DeleteMapping("/instances/{id}")
    @Operation(summary = "Delete service instance", description = "Deletes a service instance")
    public ResponseEntity<Void> deleteServiceInstance(
            @Parameter(description = "Service instance ID") @PathVariable String id) {
        log.info("DELETE /api/services/instances/{} - Deleting service instance", id);
        serviceInstanceService.deleteServiceInstance(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Start multiple service instances.
     */
    @PostMapping("/actions/start")
    @Operation(summary = "Start service instances", description = "Starts multiple service instances by their IDs")
    public ResponseEntity<List<ServiceActionResponse>> startServiceInstances(
            @RequestBody ServiceActionRequest request) {
        log.info("POST /api/services/actions/start - Starting {} service instances", request.getInstanceIds().size());
        List<ServiceActionResponse> responses = serviceInstanceService.startServiceInstances(request);
        
        long successCount = responses.stream().filter(ServiceActionResponse::isSuccess).count();
        log.info("Start action completed: {} successful, {} failed", successCount, responses.size() - successCount);
        
        return ResponseEntity.ok(responses);
    }
    
    /**
     * Stop multiple service instances.
     */
    @PostMapping("/actions/stop")
    @Operation(summary = "Stop service instances", description = "Stops multiple service instances by their IDs")
    public ResponseEntity<List<ServiceActionResponse>> stopServiceInstances(
            @RequestBody ServiceActionRequest request) {
        log.info("POST /api/services/actions/stop - Stopping {} service instances", request.getInstanceIds().size());
        List<ServiceActionResponse> responses = serviceInstanceService.stopServiceInstances(request);
        
        long successCount = responses.stream().filter(ServiceActionResponse::isSuccess).count();
        log.info("Stop action completed: {} successful, {} failed", successCount, responses.size() - successCount);
        
        return ResponseEntity.ok(responses);
    }
}
