package com.monitoring.dashboard.controller;

import com.monitoring.dashboard.dto.CreateDeploymentConfigBatchRequest;
import com.monitoring.dashboard.dto.DeploymentConfigDTO;
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

    @GetMapping("/getServices")
    public List<?> getServices() {
        return deploymentConfigService.getServices();
    }

    @GetMapping("/getInfraTypes")
    public List<?> getInfraTypes() {
        return deploymentConfigService.getInfraTypes();
    }

    @GetMapping("/getInfraInstances")
    public List<?> getInfraInstances(@RequestParam(required = false) String type) {
        return deploymentConfigService.getInfraInstances(type);
    }

    @GetMapping("/getProfiles")
    public List<?> getProfiles(@RequestParam(required = false) Long projectId,
                              @RequestParam(required = false) Integer envId,
                              @RequestParam(required = false) Integer regionId) {
        return deploymentConfigService.getProfiles(projectId, envId, regionId);
    }

    @GetMapping("/getDeploymentConfigsForProject")
    public List<DeploymentConfig> getDeploymentConfigsForProject(@RequestParam Long projectId) {
        return deploymentConfigService.getDeploymentConfigsForProject(projectId);
    }

    @GetMapping("/getByProject/{projectId}")
    public List<DeploymentConfig> getDeploymentConfigsByProject(@PathVariable Long projectId) {
        return deploymentConfigService.getDeploymentConfigsForProject(projectId);
    }

    @PostMapping("/createBatch")
    public List<DeploymentConfig> createBatch(@RequestBody CreateDeploymentConfigBatchRequest request) {
        return deploymentConfigService.createBatch(request);
    }

    @PostMapping("/create")
    public DeploymentConfig create(@RequestBody DeploymentConfigDTO dto) {
        return deploymentConfigService.createDeploymentConfig(dto);
    }

    @PutMapping("/{configId}")
    public DeploymentConfig updateDeploymentConfig(@PathVariable Long configId, @RequestBody DeploymentConfigDTO dto) {
        return deploymentConfigService.updateDeploymentConfig(configId, dto);
    }

    @DeleteMapping("/{configId}")
    public void deleteDeploymentConfig(@PathVariable Long configId) {
        deploymentConfigService.deleteDeploymentConfig(configId);
    }
}
