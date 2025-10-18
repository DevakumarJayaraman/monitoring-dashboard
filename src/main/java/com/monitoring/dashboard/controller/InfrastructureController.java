package com.monitoring.dashboard.controller;

import com.monitoring.dashboard.dto.InfraDetailDTO;
import com.monitoring.dashboard.dto.InfrastructureDTO;
import com.monitoring.dashboard.service.InfrastructureService;
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
@RequestMapping("/api/infrastructure")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174"})
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Infrastructure", description = "Infrastructure management APIs")
public class InfrastructureController {

    private final InfrastructureService infrastructureService;

    @GetMapping("/getAllInfrastructure")
    @Operation(summary = "Get all infrastructure", description = "Returns a list of all infrastructure")
    public ResponseEntity<List<InfrastructureDTO>> getAllInfrastructure() {
        log.info("GET /api/infrastructure/getAllInfrastructure - Get all infrastructure");
        return ResponseEntity.ok(infrastructureService.getAllInfrastructure());
    }

    @GetMapping("/getAllInfrastructureDetails")
    @Operation(summary = "Get all infrastructure with detailed metrics",
               description = "Returns a list of all infrastructure with complete VM or ECS metrics")
    public ResponseEntity<List<InfraDetailDTO>> getAllInfrastructureDetails() {
        log.info("GET /api/infrastructure/getAllInfrastructureDetails - Get all infrastructure with detailed metrics");
        return ResponseEntity.ok(infrastructureService.getAllInfrastructureDetails());
    }

    @GetMapping("/getInfrastructureById/{id}")
    @Operation(summary = "Get infrastructure by ID", description = "Returns infrastructure details by ID")
    public ResponseEntity<InfrastructureDTO> getInfrastructureById(@PathVariable Long id) {
        log.info("GET /api/infrastructure/getInfrastructureById/{} - Get infrastructure by id", id);
        return ResponseEntity.ok(infrastructureService.getInfrastructureById(id));
    }

    @GetMapping("/getInfrastructureDetailsById/{id}")
    @Operation(summary = "Get infrastructure details by ID",
               description = "Returns infrastructure with complete metrics by ID")
    public ResponseEntity<InfraDetailDTO> getInfrastructureDetailsById(@PathVariable Long id) {
        log.info("GET /api/infrastructure/getInfrastructureDetailsById/{} - Get infrastructure details by id", id);
        return ResponseEntity.ok(infrastructureService.getInfrastructureDetailsById(id));
    }

    @GetMapping("/getInfrastructureDetailsByType/{type}")
    @Operation(summary = "Get infrastructure details by type",
               description = "Returns infrastructure list with complete metrics filtered by type (ecs/linux/windows)")
    public ResponseEntity<List<InfraDetailDTO>> getInfrastructureDetailsByType(@PathVariable String type) {
        log.info("GET /api/infrastructure/getInfrastructureDetailsByType/{} - Get infrastructure details by type", type);
        return ResponseEntity.ok(infrastructureService.getInfrastructureDetailsByType(type));
    }

    @GetMapping("/getInfrastructureDetailsByProject/{projectId}")
    @Operation(summary = "Get infrastructure details by project",
               description = "Returns infrastructure list with complete metrics filtered by project ID")
    public ResponseEntity<List<InfraDetailDTO>> getInfrastructureDetailsByProject(@PathVariable Long projectId) {
        log.info("GET /api/infrastructure/getInfrastructureDetailsByProject/{} - Get infrastructure details by project", projectId);
        return ResponseEntity.ok(infrastructureService.getInfrastructureDetailsByProject(projectId));
    }

    @GetMapping("/getInfrastructureByName/{name}")
    public ResponseEntity<InfrastructureDTO> getInfrastructureByName(@PathVariable String name) {
        log.info("GET /api/infrastructure/getInfrastructureByName/{} - Get infrastructure by name", name);
        return ResponseEntity.ok(infrastructureService.getInfrastructureByName(name));
    }

    @GetMapping("/getInfrastructureByType/{type}")
    public ResponseEntity<List<InfrastructureDTO>> getInfrastructureByType(@PathVariable String type) {
        log.info("GET /api/infrastructure/getInfrastructureByType/{} - Get infrastructure by type", type);
        return ResponseEntity.ok(infrastructureService.getInfrastructureByType(type));
    }

    @GetMapping("/getInfrastructureByEnvironment/{environment}")
    public ResponseEntity<List<InfrastructureDTO>> getInfrastructureByEnvironment(@PathVariable String environment) {
        log.info("GET /api/infrastructure/getInfrastructureByEnvironment/{} - Get infrastructure by environment", environment);
        return ResponseEntity.ok(infrastructureService.getInfrastructureByEnvironment(environment));
    }

    @GetMapping("/getDistinctEnvironments")
    @Operation(summary = "Get distinct environments", description = "Returns a list of distinct environment values")
    public ResponseEntity<List<String>> getDistinctEnvironments() {
        log.info("GET /api/infrastructure/getDistinctEnvironments - Get distinct environments");
        return ResponseEntity.ok(infrastructureService.getDistinctEnvironments());
    }

    @GetMapping("/getDistinctRegions")
    @Operation(summary = "Get distinct regions", description = "Returns a list of distinct region values")
    public ResponseEntity<List<String>> getDistinctRegions() {
        log.info("GET /api/infrastructure/getDistinctRegions - Get distinct regions");
        return ResponseEntity.ok(infrastructureService.getDistinctRegions());
    }

    @PostMapping("/createInfrastructure")
    public ResponseEntity<InfrastructureDTO> createInfrastructure(@Valid @RequestBody InfrastructureDTO dto) {
        log.info("POST /api/infrastructure/createInfrastructure - Create infrastructure: {}", dto.getHostname());
        InfrastructureDTO created = infrastructureService.createInfrastructure(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/updateInfrastructure/{id}")
    public ResponseEntity<InfrastructureDTO> updateInfrastructure(@PathVariable Long id, @Valid @RequestBody InfrastructureDTO dto) {
        log.info("PUT /api/infrastructure/updateInfrastructure/{} - Update infrastructure", id);
        InfrastructureDTO updated = infrastructureService.updateInfrastructure(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/deleteInfrastructure/{id}")
    public ResponseEntity<Void> deleteInfrastructure(@PathVariable Long id) {
        log.info("DELETE /api/infrastructure/deleteInfrastructure/{} - Delete infrastructure", id);
        infrastructureService.deleteInfrastructure(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException ex) {
        log.error("Error in InfrastructureController: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(new ErrorResponse(ex.getMessage()));
    }

    record ErrorResponse(String message) {}
}
