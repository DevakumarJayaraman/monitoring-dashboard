// ...contents from ServiceDTO.java, now as ComponentDTO.java...
package com.monitoring.dashboard.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Component data transfer object")
public class ComponentDTO {
    @Schema(description = "Unique identifier for the component", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
    private Long componentId;
    @NotBlank(message = "Component name is required")
    @Schema(description = "Name of the component", example = "user-component")
    private String componentName;
    @Schema(description = "Description of the component", example = "Microservice for user management")
    private String description;
    @Schema(description = "Module for this component", example = "user-module")
    private String module;

    @Schema(description = "Project ID this component belongs to")
    private Long projectId;

    @Schema(description = "Project name this component belongs to")
    private String projectName;

    @Schema(description = "Default infrastructure type for this component", example = "linux")
    private String defaultInfraType;

    @Schema(description = "Default port for this component", example = "8080")
    private Integer defaultPort;

    @Schema(description = "Total deployment configs associated with this component", example = "2")
    private Integer totalDeployments = 0;

    // Removed deployments field as ComponentDeploymentDTO is deleted
}
