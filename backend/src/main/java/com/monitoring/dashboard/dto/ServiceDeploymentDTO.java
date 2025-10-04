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
public class ServiceDeploymentDTO {
    
    private Long mappingId;
    
    @NotNull(message = "Service ID is required")
    private Long serviceId;
    private String serviceName;
    
    @NotNull(message = "Infrastructure ID is required")
    private Long infraId;
    private String infraName;
    private String infraType;
    
    @NotBlank(message = "Profile is required")
    private String profile;
    
    private Integer port;
    
    private List<DeploymentConfigDTO> configs;
}
