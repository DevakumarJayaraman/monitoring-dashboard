// ...contents from ServiceDeploymentDTO.java, now as ComponentDeploymentDTO.java...
package com.monitoring.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComponentDeploymentDTO {
    private Long mappingId;
    @NotNull(message = "Component ID is required")
    private Long componentId;
    private String componentName;
    @NotNull(message = "Infrastructure ID is required")
    private Long infraId;
    private String infraType;
    @NotBlank(message = "Profile is required")
    private String profile;
    private Integer port;
    private List<DeploymentConfigDTO> configs;
    private String hostname;
}
