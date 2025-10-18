package com.monitoring.dashboard.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.monitoring.dashboard.dto.CreateDeploymentConfigBatchRequest;
import com.monitoring.dashboard.dto.DeploymentConfigDTO;
import com.monitoring.dashboard.model.*;
import com.monitoring.dashboard.repository.ComponentRepository;
import com.monitoring.dashboard.repository.DeploymentConfigRepository;
import com.monitoring.dashboard.repository.InfrastructureRepository;
import com.monitoring.dashboard.repository.ProjectEnvironmentRepository;
import com.monitoring.dashboard.repository.ServiceInstanceRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Slf4j
public class DeploymentConfigService {

    @Autowired
    private ComponentRepository componentRepository;

    @Autowired
    private InfrastructureRepository infrastructureRepository;

    @Autowired
    private DeploymentConfigRepository deploymentConfigRepository;

    @Autowired
    private ServiceInstanceRepository serviceInstanceRepository;

    @Autowired
    private ProjectEnvironmentRepository projectEnvironmentRepository;

    @Autowired
    private ObjectMapper objectMapper;

    public List<Component> getServices() {
        return componentRepository.findAll();
    }

    public List<String> getInfraTypes() {
        return infrastructureRepository.findAll().stream()
                .map(Infrastructure::getInfraType)
                .distinct()
                .collect(Collectors.toList());
    }

    public List<Infrastructure> getInfraInstances(String type) {
        if (type == null || type.isEmpty()) {
            return infrastructureRepository.findAll();
        }
        return infrastructureRepository.findAll().stream()
                .filter(infra -> type.equals(infra.getInfraType()))
                .collect(Collectors.toList());
    }

    public List<ProjectProfiles> getProfiles(Long projectId, Integer envId, Integer regionId) {
        List<Infrastructure> infrastructures = infrastructureRepository.findAll();

        List<ProjectProfiles> allProfiles = new ArrayList<>();
        for (Infrastructure infra : infrastructures) {
            if (infra.getProjectEnvironmentMapping() != null) {
                allProfiles.addAll(infra.getProjectEnvironmentMapping().getProfiles());
            }
        }

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
    public DeploymentConfig createDeploymentConfig(DeploymentConfigDTO dto) {
        validateDeploymentConfigDto(dto);

        DeploymentConfig config = new DeploymentConfig();

        Component component = componentRepository.findById(dto.getComponentId())
                .orElseThrow(() -> new RuntimeException("Component not found with id: " + dto.getComponentId()));

        Infrastructure infrastructure = infrastructureRepository.findById(dto.getInfraId())
                .orElseThrow(() -> new RuntimeException("Infrastructure not found with id: " + dto.getInfraId()));

        config.setComponent(component);
        config.setInfrastructure(infrastructure);
        config.setBasePort(dto.getBasePort());
        config.setEnabled(dto.getEnabled() != null ? dto.getEnabled() : true);

        // Resolve and set profile (ProjectProfiles) using infra -> projectEnvironmentMapping
        String profileCode = dto.getProfile();
        if (profileCode == null || profileCode.isBlank()) {
            throw new RuntimeException("Profile is required for deployment config");
        }

        ProjectEnvironmentMapping pem = infrastructure.getProjectEnvironmentMapping();
        if (pem == null) {
            throw new RuntimeException("Infrastructure does not have a project-environment mapping to resolve profile");
        }

        String envCode = pem.getEnvironment() != null ? pem.getEnvironment().getEnvCode() : null;
        String regionCode = pem.getRegion() != null ? pem.getRegion().getRegionCode() : null;
        Long projectId = component.getProject() != null ? component.getProject().getProjectId() : null;

        ProjectProfiles resolvedProfile = projectEnvironmentRepository
                .findByProjectEnvironmentMappingProjectProjectIdAndProjectEnvironmentMappingEnvironmentEnvCodeAndProjectEnvironmentMappingRegionRegionCodeAndProfileCode(
                        projectId, envCode, regionCode, profileCode)
                .orElseThrow(() -> new RuntimeException("Profile '" + profileCode + "' not found for project/env/region mapping"));

        config.setProfile(resolvedProfile);

        // Serialize deployment parameters to BLOB
        if (dto.getDeployParams() != null && !dto.getDeployParams().isEmpty()) {
            try {
                String jsonParams = objectMapper.writeValueAsString(dto.getDeployParams());
                config.setDeployParams(jsonParams.getBytes());
            } catch (JsonProcessingException e) {
                log.error("Failed to serialize deployment parameters", e);
                throw new RuntimeException("Failed to serialize deployment parameters", e);
            }
        }

        DeploymentConfig savedConfig = deploymentConfigRepository.save(config);
        log.info("Created deployment config {} for component {} on infrastructure {} ({}), profile={}",
                savedConfig.getConfigId(), component.getComponentName(),
                infrastructure.getHostname(), infrastructure.getInfraType(), resolvedProfile.getProfileCode());

        // Create service instances based on the deployment config and infra type
        createServiceInstancesForConfig(savedConfig);

        return savedConfig;
    }

    @Transactional
    public List<DeploymentConfig> createBatch(CreateDeploymentConfigBatchRequest request) {
        if (request == null || request.getConfigs() == null || request.getConfigs().isEmpty()) {
            throw new IllegalArgumentException("At least one deployment configuration is required");
        }
        if (request.getConfigs().size() > 1) {
            throw new IllegalArgumentException("Only one deployment mapping can be created at a time");
        }

        List<DeploymentConfig> savedConfigs = new ArrayList<>();

        for (CreateDeploymentConfigBatchRequest.SingleDeploymentConfigRequest dto : request.getConfigs()) {
            DeploymentConfigDTO configDTO = new DeploymentConfigDTO();
            configDTO.setComponentId(dto.getComponentId());
            configDTO.setInfraId(dto.getInfraId());
            configDTO.setProfile(dto.getProfile());
            configDTO.setBasePort(dto.getBasePort());
            configDTO.setDeployParams(dto.getDeployParams());
            configDTO.setEnabled(true);

            savedConfigs.add(createDeploymentConfig(configDTO));
        }

        return savedConfigs;
    }

    @Transactional
    public void deleteDeploymentConfig(Long configId) {
        if (configId == null) {
            throw new IllegalArgumentException("Deployment config id is required");
        }

        DeploymentConfig config = deploymentConfigRepository.findById(configId)
                .orElseThrow(() -> new RuntimeException("Deployment config not found with id: " + configId));

        List<ServiceInstance> instances = serviceInstanceRepository.findByDeploymentConfig_ConfigId(configId);
        if (!instances.isEmpty()) {
            serviceInstanceRepository.deleteAll(instances);
            log.info("Deleted {} service instances linked to deployment config {}", instances.size(), configId);
        }

        deploymentConfigRepository.delete(config);
        log.info("Deleted deployment config {}", configId);
    }

    private void validateDeploymentConfigDto(DeploymentConfigDTO dto) {
        if (dto == null) {
            throw new IllegalArgumentException("Deployment configuration details are required");
        }
        if (dto.getComponentId() == null) {
            throw new IllegalArgumentException("Component is required for deployment configuration");
        }
        if (dto.getInfraId() == null) {
            throw new IllegalArgumentException("Infrastructure is required for deployment configuration");
        }
        if (dto.getProfile() == null || dto.getProfile().isBlank()) {
            throw new IllegalArgumentException("Profile is required for deployment configuration");
        }
        if (dto.getBasePort() == null) {
            throw new IllegalArgumentException("Base port is required for deployment configuration");
        }
        if (dto.getBasePort() <= 0) {
            throw new IllegalArgumentException("Base port must be a positive number");
        }
    }

    /**
     * Create service instances based on deployment configuration.
     * Reads infra-specific parameters from deployParams:
     * - For ECS: uses minPods as initial instance count (can scale up to maxPods later)
     * - For VM (Linux/Windows): uses instanceCount for fixed number of instances
     */
    @Transactional
    public void createServiceInstancesForConfig(DeploymentConfig config) {
        Component component = config.getComponent();
        Infrastructure infrastructure = config.getInfrastructure();
        Integer basePort = config.getBasePort();

        // Get deployment parameters
        Map<String, String> deployParams = getDeployParams(config);

        // Determine instance count based on infra type
        int instanceCount = getInstanceCountFromParams(infrastructure.getInfraType(), deployParams);

        log.info("Creating {} service instance(s) for component {} on infrastructure {} ({})",
                instanceCount, component.getComponentName(), infrastructure.getHostname(), infrastructure.getInfraType());

        // Resolve profile code once (prefer mapped profile then infra mapping)
        String resolvedProfile = resolveProfileCode(config);
        String profileForId = resolvedProfile != null ? resolvedProfile : "unknown";
        String profileForInstance = resolvedProfile != null ? resolvedProfile : ""; // DB profile column is NOT NULL in schema

        for (int i = 0; i < instanceCount; i++) {
            ServiceInstance instance = new ServiceInstance();

            // Generate unique instance ID
            String instanceId = String.format("%s-%s-%s-%d",
                    component.getComponentName(),
                    infrastructure.getInfraName() != null ? infrastructure.getInfraName() : infrastructure.getHostname(),
                    // Use resolved profile code (fallback to 'unknown' for id)
                    profileForId,
                    i + 1);

            instance.setInstanceId(instanceId);
            instance.setDeploymentConfig(config);
            instance.setServiceName(component.getComponentName());
            instance.setMachineName(infrastructure.getHostname());
            instance.setInfraType(infrastructure.getInfraType());
            // Set profile using resolved profile code (empty string if unresolved to satisfy NOT NULL)
            instance.setProfile(profileForInstance);

            // Set port (increment from basePort if multiple instances)
            if (basePort != null) {
                instance.setPort(basePort + i);
            }

            // Initial status is null - will be populated by runtime agent
            instance.setStatus(null);
            instance.setVersion(null);
            instance.setUptimeSeconds(null);
            instance.setDeployedAt(LocalDateTime.now());
            instance.setLastUpdated(LocalDateTime.now());

            serviceInstanceRepository.save(instance);
            log.info("Created service instance: {}", instanceId);
        }
    }

    /**
     * Extract instance count from deployment parameters based on infrastructure type.
     * - For ECS: Returns minPods (default 1), can autoscale to maxPods
     * - For Linux/Windows VMs: Returns instanceCount (default 1)
     */
    private int getInstanceCountFromParams(String infraType, Map<String, String> deployParams) {
        if (deployParams == null || deployParams.isEmpty()) {
            return 1; // Default to 1 instance
        }

        String infraTypeLower = infraType != null ? infraType.toLowerCase() : "";

        if ("ecs".equals(infraTypeLower)) {
            // For ECS, use minPods as initial instance count
            String minPods = deployParams.get("minPods");
            if (minPods != null) {
                try {
                    return Integer.parseInt(minPods);
                } catch (NumberFormatException e) {
                    log.warn("Invalid minPods value: {}, defaulting to 1", minPods);
                    return 1;
                }
            }
            return 1; // Default for ECS
        } else {
            // For Linux/Windows VMs, use instanceCount
            String instanceCountStr = deployParams.get("instanceCount");
            if (instanceCountStr != null) {
                try {
                    return Integer.parseInt(instanceCountStr);
                } catch (NumberFormatException e) {
                    log.warn("Invalid instanceCount value: {}, defaulting to 1", instanceCountStr);
                    return 1;
                }
            }
            return 1; // Default for VMs
        }
    }

    /**
     * Update deployment config and recreate service instances if needed.
     */
    @Transactional
    public DeploymentConfig updateDeploymentConfig(Long configId, DeploymentConfigDTO dto) {
        DeploymentConfig config = deploymentConfigRepository.findById(configId)
                .orElseThrow(() -> new RuntimeException("Deployment config not found with id: " + configId));

        Infrastructure existingInfra = config.getInfrastructure();
        // Get old deploy params to compare instance count changes
        Map<String, String> oldParams = getDeployParams(config);
        int oldInstanceCount = getInstanceCountFromParams(
                existingInfra != null ? existingInfra.getInfraType() : null,
                oldParams);

        boolean infraChanged = false;
        if (dto.getInfraId() != null && (existingInfra == null || !Objects.equals(existingInfra.getInfraId(), dto.getInfraId()))) {
            Long componentId = config.getComponent() != null ? config.getComponent().getComponentId() : null;
            if (componentId != null) {
                boolean duplicateExists = deploymentConfigRepository.findByComponent_ComponentId(componentId)
                        .stream()
                        .anyMatch(existing -> !Objects.equals(existing.getConfigId(), configId)
                                && existing.getInfrastructure() != null
                                && Objects.equals(existing.getInfrastructure().getInfraId(), dto.getInfraId()));
                if (duplicateExists) {
                    throw new RuntimeException("A deployment mapping already exists for this component and infrastructure.");
                }
            }

            Infrastructure newInfrastructure = infrastructureRepository.findById(dto.getInfraId())
                    .orElseThrow(() -> new RuntimeException("Infrastructure not found with id: " + dto.getInfraId()));
            config.setInfrastructure(newInfrastructure);
            infraChanged = true;
        }

        Integer previousBasePort = config.getBasePort();
        boolean basePortChanged = !Objects.equals(previousBasePort, dto.getBasePort());

        config.setBasePort(dto.getBasePort());
        if (dto.getEnabled() != null) {
            config.setEnabled(dto.getEnabled());
        }

        // Update profile if provided
        if (dto.getProfile() != null && !dto.getProfile().isBlank()) {
            String profileCode = dto.getProfile();
            Infrastructure infra = config.getInfrastructure();
            ProjectEnvironmentMapping pem = infra.getProjectEnvironmentMapping();
            if (pem == null) {
                throw new RuntimeException("Infrastructure does not have project-environment mapping to resolve profile");
            }
            String envCode = pem.getEnvironment() != null ? pem.getEnvironment().getEnvCode() : null;
            String regionCode = pem.getRegion() != null ? pem.getRegion().getRegionCode() : null;
            Long projectId = config.getComponent() != null && config.getComponent().getProject() != null
                    ? config.getComponent().getProject().getProjectId() : null;

            ProjectProfiles resolvedProfile = projectEnvironmentRepository
                    .findByProjectEnvironmentMappingProjectProjectIdAndProjectEnvironmentMappingEnvironmentEnvCodeAndProjectEnvironmentMappingRegionRegionCodeAndProfileCode(
                            projectId, envCode, regionCode, profileCode)
                    .orElseThrow(() -> new RuntimeException("Profile '" + profileCode + "' not found for project/env/region mapping"));

            config.setProfile(resolvedProfile);
        }

        // Update deployment parameters
        if (dto.getDeployParams() != null) {
            if (dto.getDeployParams().isEmpty()) {
                config.setDeployParams(null);
            } else {
                try {
                    String jsonParams = objectMapper.writeValueAsString(dto.getDeployParams());
                    config.setDeployParams(jsonParams.getBytes());
                } catch (JsonProcessingException e) {
                    log.error("Failed to serialize deployment parameters", e);
                    throw new RuntimeException("Failed to serialize deployment parameters", e);
                }
            }
        }

        DeploymentConfig updated = deploymentConfigRepository.save(config);

        Map<String, String> newParams = dto.getDeployParams() != null ? dto.getDeployParams() : getDeployParams(updated);
        // Check if instance count changed in deploy params
        int newInstanceCount = getInstanceCountFromParams(updated.getInfrastructure().getInfraType(), newParams);
        boolean instanceCountChanged = (oldInstanceCount != newInstanceCount);

        // Recreate service instances if instance count or base port changed
        if (instanceCountChanged || basePortChanged || infraChanged) {
            log.info("Instance count or port changed (old: {}, new: {}), recreating service instances",
                    oldInstanceCount, newInstanceCount);
            // Delete existing instances
            serviceInstanceRepository.deleteAll(config.getServiceInstances());
            // Create new instances
            createServiceInstancesForConfig(updated);
        }

        return updated;
    }

    /**
     * Convert deployment parameters from BLOB to Map.
     */
    public Map<String, String> getDeployParams(DeploymentConfig config) {
        if (config.getDeployParams() == null || config.getDeployParams().length == 0) {
            return Map.of();
        }

        try {
            String jsonParams = new String(config.getDeployParams());
            return objectMapper.readValue(jsonParams, new TypeReference<Map<String, String>>() {});
        } catch (Exception e) {
            log.error("Failed to deserialize deployment parameters", e);
            return Map.of();
        }
    }

    /**
     * Resolves the profile code for a deployment config via config.profile (ops_profiles) or infra -> projectEnvironmentMapping -> profiles.
     * If not found, returns null.
     */
    private String resolveProfileCode(DeploymentConfig config) {
        if (config == null) return null;
        // Prefer explicit ProjectProfiles mapping on DeploymentConfig
        ProjectProfiles cfgProfile = config.getProfile();
        if (cfgProfile != null && cfgProfile.getProfileCode() != null && !cfgProfile.getProfileCode().isBlank()) {
            return cfgProfile.getProfileCode();
        }

        // Fallback to infrastructure -> projectEnvironmentMapping -> profiles
        Infrastructure infra = config.getInfrastructure();
        if (infra == null) return null;
        ProjectEnvironmentMapping pem = infra.getProjectEnvironmentMapping();
        if (pem == null) return null;
        List<ProjectProfiles> profiles = pem.getProfiles();
        if (profiles == null || profiles.isEmpty()) return null;
        // If only one profile, return its code
        if (profiles.size() == 1) return profiles.get(0).getProfileCode();
        // If multiple, try to match by enabled/active
        for (ProjectProfiles profile : profiles) {
            if ("ACTIVE".equalsIgnoreCase(profile.getStatus())) {
                return profile.getProfileCode();
            }
        }
        // Fallback to first
        return profiles.get(0).getProfileCode();
    }

    public List<DeploymentConfig> getDeploymentConfigsForProject(Long projectId) {
        if (projectId == null) return List.of();
        return deploymentConfigRepository.findByComponent_Project_ProjectId(projectId);
    }
}
