package com.monitoring.dashboard.controller;

import com.monitoring.dashboard.dto.CreateDeploymentConfigBatchRequest;
import com.monitoring.dashboard.model.DeploymentConfig;
import com.monitoring.dashboard.service.DeploymentConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/deployment-config")
public class DeploymentConfigController {

    @Autowired
    private DeploymentConfigService deploymentConfigService;

    @GetMapping("/services")
    public List<?> getServices() {
        return deploymentConfigService.getServices();
    }

    @GetMapping("/infra-types")
    public List<?> getInfraTypes() {
        return deploymentConfigService.getInfraTypes();
    }

    @GetMapping("/infra-instances")
    public List<?> getInfraInstances(@RequestParam(required = false) String type) {
        return deploymentConfigService.getInfraInstances(type);
    }

    @GetMapping("/profiles")
    public List<?> getProfiles(@RequestParam(required = false) Long projectId,
                              @RequestParam(required = false) Integer envId,
                              @RequestParam(required = false) Integer regionId) {
        return deploymentConfigService.getProfiles(projectId, envId, regionId);
    }

    @PostMapping("/batch")
    public List<DeploymentConfig> createBatch(@RequestBody CreateDeploymentConfigBatchRequest request) {
        return deploymentConfigService.createBatch(request);
    }
}

