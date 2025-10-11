package com.monitoring.dashboard.dto;

import lombok.Data;
import java.util.List;

@Data
public class CreateDeploymentConfigBatchRequest {
    private List<SingleDeploymentConfigRequest> configs;

    @Data
    public static class SingleDeploymentConfigRequest {
        private Long componentId;
        private Long infraId;
        private String profile;
        private String resourceName;
        private String limitValue;
        private String unit;
    }
}
