package com.monitoring.dashboard.controller;

import com.monitoring.dashboard.dto.ComponentDTO;
import com.monitoring.dashboard.service.ComponentService;
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
@RequestMapping("/api/components")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Component Management", description = "API for managing components in the monitoring dashboard")
public class ComponentController {
    private final ComponentService componentService;

    @Operation(summary = "Get all components", description = "Retrieve a list of all components")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved list of components",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ComponentDTO.class))),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping
    public ResponseEntity<List<ComponentDTO>> getAllComponents() {
        log.info("GET /api/components - Get all components");
        return ResponseEntity.ok(componentService.getAllComponents());
    }

    @Operation(summary = "Get component by ID", description = "Retrieve a component by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved component",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ComponentDTO.class))),
            @ApiResponse(responseCode = "404", description = "Component not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/{id}")
    public ResponseEntity<ComponentDTO> getComponentById(@PathVariable Long id) {
        log.info("GET /api/components/{} - Get component by id", id);
        return ResponseEntity.ok(componentService.getComponentById(id));
    }

    @Operation(summary = "Get component by name", description = "Retrieve a component by its name")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved component",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ComponentDTO.class))),
            @ApiResponse(responseCode = "404", description = "Component not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/name/{name}")
    public ResponseEntity<ComponentDTO> getComponentByName(@PathVariable String name) {
        log.info("GET /api/components/name/{} - Get component by name", name);
        return ResponseEntity.ok(componentService.getComponentByName(name));
    }

    @Operation(summary = "Get components by module", description = "Retrieve a list of components by the module name")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved list of components",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ComponentDTO.class))),
            @ApiResponse(responseCode = "404", description = "No components found for the module"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/module/{module}")
    public ResponseEntity<List<ComponentDTO>> getComponentsByModule(@PathVariable String module) {
        log.info("GET /api/components/module/{} - Get components by module", module);
        return ResponseEntity.ok(componentService.getComponentsByModule(module));
    }

    @Operation(summary = "Get components by project", description = "Retrieve a list of components belonging to a specific project")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully retrieved list of components",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ComponentDTO.class))),
            @ApiResponse(responseCode = "404", description = "No components found for the project"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<ComponentDTO>> getComponentsByProject(@PathVariable Long projectId) {
        log.info("GET /api/components/project/{} - Get components by project", projectId);
        return ResponseEntity.ok(componentService.getComponentsByProject(projectId));
    }

    @Operation(summary = "Create a new component", description = "Add a new component to the system")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Successfully created component",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ComponentDTO.class))),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping
    public ResponseEntity<ComponentDTO> createComponent(@Valid @RequestBody ComponentDTO dto) {
        log.info("POST /api/components - Create component: {}", dto.getComponentName());
        ComponentDTO created = componentService.createComponent(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @Operation(summary = "Update an existing component", description = "Modify the details of an existing component")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully updated component",
                    content = @Content(mediaType = "application/json",
                            schema = @Schema(implementation = ComponentDTO.class))),
            @ApiResponse(responseCode = "404", description = "Component not found"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PutMapping("/{id}")
    public ResponseEntity<ComponentDTO> updateComponent(@PathVariable Long id, @Valid @RequestBody ComponentDTO dto) {
        log.info("PUT /api/components/{} - Update component", id);
        return ResponseEntity.ok(componentService.updateComponent(id, dto));
    }

    @Operation(summary = "Delete a component", description = "Remove a component from the system")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Successfully deleted component"),
            @ApiResponse(responseCode = "404", description = "Component not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComponent(@PathVariable Long id) {
        log.info("DELETE /api/components/{} - Delete component", id);
        componentService.deleteComponent(id);
        return ResponseEntity.noContent().build();
    }
}
