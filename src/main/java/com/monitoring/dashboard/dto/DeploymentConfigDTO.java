package com.monitoring.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeploymentConfigDTO {
    
    private Long configId;
    private Long serviceId;
    private Long infraId;
    private String profile;
    
    @NotBlank(message = "Resource name is required")
    private String resourceName;
    
    @NotBlank(message = "Limit value is required")
    private String limitValue;
    
    private String unit;
}
