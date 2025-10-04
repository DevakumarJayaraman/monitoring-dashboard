package com.monitoring.dashboard.controller;

import com.monitoring.dashboard.dto.InfrastructureDTO;
import com.monitoring.dashboard.service.InfrastructureService;
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
public class InfrastructureController {

    private final InfrastructureService infrastructureService;

    @GetMapping
    public ResponseEntity<List<InfrastructureDTO>> getAllInfrastructure() {
        log.info("GET /api/infrastructure - Get all infrastructure");
        return ResponseEntity.ok(infrastructureService.getAllInfrastructure());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InfrastructureDTO> getInfrastructureById(@PathVariable Long id) {
        log.info("GET /api/infrastructure/{} - Get infrastructure by id", id);
        return ResponseEntity.ok(infrastructureService.getInfrastructureById(id));
    }

    @GetMapping("/name/{name}")
    public ResponseEntity<InfrastructureDTO> getInfrastructureByName(@PathVariable String name) {
        log.info("GET /api/infrastructure/name/{} - Get infrastructure by name", name);
        return ResponseEntity.ok(infrastructureService.getInfrastructureByName(name));
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<InfrastructureDTO>> getInfrastructureByType(@PathVariable String type) {
        log.info("GET /api/infrastructure/type/{} - Get infrastructure by type", type);
        return ResponseEntity.ok(infrastructureService.getInfrastructureByType(type));
    }

    @GetMapping("/environment/{environment}")
    public ResponseEntity<List<InfrastructureDTO>> getInfrastructureByEnvironment(@PathVariable String environment) {
        log.info("GET /api/infrastructure/environment/{} - Get infrastructure by environment", environment);
        return ResponseEntity.ok(infrastructureService.getInfrastructureByEnvironment(environment));
    }

    @PostMapping
    public ResponseEntity<InfrastructureDTO> createInfrastructure(@Valid @RequestBody InfrastructureDTO dto) {
        log.info("POST /api/infrastructure - Create infrastructure: {}", dto.getInfraName());
        InfrastructureDTO created = infrastructureService.createInfrastructure(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<InfrastructureDTO> updateInfrastructure(
            @PathVariable Long id,
            @Valid @RequestBody InfrastructureDTO dto) {
        log.info("PUT /api/infrastructure/{} - Update infrastructure", id);
        return ResponseEntity.ok(infrastructureService.updateInfrastructure(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInfrastructure(@PathVariable Long id) {
        log.info("DELETE /api/infrastructure/{} - Delete infrastructure", id);
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
