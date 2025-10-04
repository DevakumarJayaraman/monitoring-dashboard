package com.monitoring.dashboard.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Service data transfer object")
public class ServiceDTO {
    
    @Schema(description = "Unique identifier for the service", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
    private Long serviceId;
    
    @NotBlank(message = "Service name is required")
    @Schema(description = "Name of the service", example = "user-service", required = true)
    private String serviceName;
    
    @Schema(description = "Description of the service", example = "Microservice for user management")
    private String description;
    
    @Schema(description = "Team that owns this service", example = "platform-team")
    private String owningTeam;
    
    @Schema(description = "List of deployments for this service")
    private List<ServiceDeploymentDTO> deployments;
    
    @Schema(description = "Total number of deployments", example = "5", accessMode = Schema.AccessMode.READ_ONLY)
    private Integer totalDeployments;
}