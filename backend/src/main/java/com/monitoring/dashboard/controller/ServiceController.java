package com.monitoring.dashboard.controller;

import com.monitoring.dashboard.dto.ServiceDTO;
import com.monitoring.dashboard.service.ServiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Service Management", description = "API for managing services in the monitoring dashboard")
public class ServiceController {

    private final ServiceService serviceService;

    @GetMapping
    @Operation(summary = "Get all services", description = "Retrieve a list of all services")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved services",
                content = @Content(mediaType = "application/json", 
                                 schema = @Schema(implementation = ServiceDTO.class)))
    public ResponseEntity<List<ServiceDTO>> getAllServices() {
        log.info("GET /api/services - Get all services");
        return ResponseEntity.ok(serviceService.getAllServices());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get service by ID", description = "Retrieve a specific service by its ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Service found",
                    content = @Content(mediaType = "application/json", 
                                     schema = @Schema(implementation = ServiceDTO.class))),
        @ApiResponse(responseCode = "404", description = "Service not found",
                    content = @Content(mediaType = "application/json",
                                     schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ServiceDTO> getServiceById(
            @Parameter(description = "ID of the service to retrieve", required = true)
            @PathVariable Long id) {
        log.info("GET /api/services/{} - Get service by id", id);
        return ResponseEntity.ok(serviceService.getServiceById(id));
    }

    @GetMapping("/name/{name}")
    @Operation(summary = "Get service by name", description = "Retrieve a specific service by its name")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Service found",
                    content = @Content(mediaType = "application/json", 
                                     schema = @Schema(implementation = ServiceDTO.class))),
        @ApiResponse(responseCode = "404", description = "Service not found",
                    content = @Content(mediaType = "application/json",
                                     schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ServiceDTO> getServiceByName(
            @Parameter(description = "Name of the service to retrieve", required = true)
            @PathVariable String name) {
        log.info("GET /api/services/name/{} - Get service by name", name);
        return ResponseEntity.ok(serviceService.getServiceByName(name));
    }

    @GetMapping("/team/{team}")
    @Operation(summary = "Get services by team", description = "Retrieve all services belonging to a specific team")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved services for team",
                content = @Content(mediaType = "application/json", 
                                 schema = @Schema(implementation = ServiceDTO.class)))
    public ResponseEntity<List<ServiceDTO>> getServicesByTeam(
            @Parameter(description = "Name of the team", required = true)
            @PathVariable String team) {
        log.info("GET /api/services/team/{} - Get services by team", team);
        return ResponseEntity.ok(serviceService.getServicesByTeam(team));
    }

    @PostMapping
    @Operation(summary = "Create a new service", description = "Create a new service in the system")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Service created successfully",
                    content = @Content(mediaType = "application/json", 
                                     schema = @Schema(implementation = ServiceDTO.class))),
        @ApiResponse(responseCode = "400", description = "Invalid input data",
                    content = @Content(mediaType = "application/json",
                                     schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ServiceDTO> createService(
            @Parameter(description = "Service data to create", required = true)
            @Valid @RequestBody ServiceDTO dto) {
        log.info("POST /api/services - Create service: {}", dto.getServiceName());
        ServiceDTO created = serviceService.createService(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a service", description = "Update an existing service")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Service updated successfully",
                    content = @Content(mediaType = "application/json", 
                                     schema = @Schema(implementation = ServiceDTO.class))),
        @ApiResponse(responseCode = "404", description = "Service not found",
                    content = @Content(mediaType = "application/json",
                                     schema = @Schema(implementation = ErrorResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid input data",
                    content = @Content(mediaType = "application/json",
                                     schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<ServiceDTO> updateService(
            @Parameter(description = "ID of the service to update", required = true)
            @PathVariable Long id,
            @Parameter(description = "Updated service data", required = true)
            @Valid @RequestBody ServiceDTO dto) {
        log.info("PUT /api/services/{} - Update service", id);
        return ResponseEntity.ok(serviceService.updateService(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a service", description = "Delete a service from the system")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Service deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Service not found",
                    content = @Content(mediaType = "application/json",
                                     schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Void> deleteService(
            @Parameter(description = "ID of the service to delete", required = true)
            @PathVariable Long id) {
        log.info("DELETE /api/services/{} - Delete service", id);
        serviceService.deleteService(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException ex) {
        log.error("Error in ServiceController: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
    }

    @Schema(description = "Error response")
    record ErrorResponse(
        @Schema(description = "Error message", example = "Service not found")
        String message
    ) {}
}