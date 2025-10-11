package com.monitoring.dashboard.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateComponentDeploymentBatchRequest {

    @NotNull(message = "Deployment mappings are required")
    private List<DeploymentMapping> deployments;

    @Data
    public static class DeploymentMapping {
        @NotNull(message = "Component ID is required")
        private Long componentId;

        @NotNull(message = "Infrastructure ID is required")
        private Long infraId;

        @NotBlank(message = "Profile is required")
        private String profile;

        private Integer port;
        private String componentVersion;
        private String status;
        private Long uptimeSeconds;
        private java.util.Map<String, String> dynamicParams;
    }
}
