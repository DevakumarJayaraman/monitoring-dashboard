package com.monitoring.dashboard.service;

import com.monitoring.dashboard.dto.CreateDeploymentConfigBatchRequest;
import com.monitoring.dashboard.model.Component;
import com.monitoring.dashboard.model.DeploymentConfig;
import com.monitoring.dashboard.model.Infrastructure;
import com.monitoring.dashboard.model.ProjectProfiles;
import com.monitoring.dashboard.repository.ComponentRepository;
import com.monitoring.dashboard.repository.DeploymentConfigRepository;
import com.monitoring.dashboard.repository.InfrastructureRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DeploymentConfigService {

    @Autowired
    private ComponentRepository componentRepository;

    @Autowired
    private InfrastructureRepository infrastructureRepository;

    @Autowired
    private DeploymentConfigRepository deploymentConfigRepository;

    public List<Component> getServices() {
        return componentRepository.findAll();
    }

    public List<String> getInfraTypes() {
        // Get distinct infrastructure types
        return infrastructureRepository.findAll().stream()
                .map(Infrastructure::getInfraType)
                .distinct()
                .collect(Collectors.toList());
    }

    public List<Infrastructure> getInfraInstances(String type) {
        if (type == null || type.isEmpty()) {
            return infrastructureRepository.findAll();
        }
        // Filter by type
        return infrastructureRepository.findAll().stream()
                .filter(infra -> type.equals(infra.getInfraType()))
                .collect(Collectors.toList());
    }

    public List<ProjectProfiles> getProfiles(Long projectId, Integer envId, Integer regionId) {
        // Fetch all profiles and filter based on provided criteria
        // This is a simple implementation - you may want to add custom repository methods for better performance
        List<Infrastructure> infrastructures = infrastructureRepository.findAll();

        List<ProjectProfiles> allProfiles = new ArrayList<>();
        for (Infrastructure infra : infrastructures) {
            if (infra.getProjectEnvironmentMapping() != null) {
                allProfiles.addAll(infra.getProjectEnvironmentMapping().getProfiles());
            }
        }

        // Filter based on criteria if provided
        return allProfiles.stream()
                .filter(profile -> {
                    if (projectId != null && profile.getProjectId() != null) {
                        return projectId.equals(profile.getProjectId());
                    }
                    return true;
                })
                .filter(profile -> {
                    if (envId != null && profile.getEnvironment() != null) {
                        return envId.equals(profile.getEnvironment().getEnvId());
                    }
                    return true;
                })
                .filter(profile -> {
                    if (regionId != null && profile.getRegion() != null) {
                        return regionId.equals(profile.getRegion().getRegionId());
                    }
                    return true;
                })
                .distinct()
                .collect(Collectors.toList());
    }

    @Transactional
    public List<DeploymentConfig> createBatch(CreateDeploymentConfigBatchRequest request) {
        List<DeploymentConfig> savedConfigs = new ArrayList<>();

        for (CreateDeploymentConfigBatchRequest.SingleDeploymentConfigRequest dto : request.getConfigs()) {
            DeploymentConfig config = new DeploymentConfig();

            // Set component
            if (dto.getComponentId() != null) {
                componentRepository.findById(dto.getComponentId()).ifPresent(config::setComponent);
            }

            // Set infrastructure
            if (dto.getInfraId() != null) {
                infrastructureRepository.findById(dto.getInfraId()).ifPresent(config::setInfrastructure);
            }

            // Set other fields
            config.setProfile(dto.getProfile());
            config.setResourceName(dto.getResourceName());
            config.setLimitValue(dto.getLimitValue());
            config.setUnit(dto.getUnit());

            savedConfigs.add(deploymentConfigRepository.save(config));
        }

        return savedConfigs;
    }
}
