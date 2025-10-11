// ...contents from ServiceDTO.java, now as ComponentDTO.java...
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
@Schema(description = "Component data transfer object")
public class ComponentDTO {
    @Schema(description = "Unique identifier for the component", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
    private Long componentId;
    @NotBlank(message = "Component name is required")
    @Schema(description = "Name of the component", example = "user-component", required = true)
    private String componentName;
    @Schema(description = "Description of the component", example = "Microservice for user management")
    private String description;
    @Schema(description = "Module for this component", example = "user-module")
    private String module;

    @Schema(description = "Project ID this component belongs to")
    private Long projectId;

    @Schema(description = "Project name this component belongs to")
    private String projectName;

    @Schema(description = "List of deployments for this component")
    private List<ComponentDeploymentDTO> deployments;
    @Schema(description = "Total number of deployments", example = "5", accessMode = Schema.AccessMode.READ_ONLY)
    private Integer totalDeployments;
}
