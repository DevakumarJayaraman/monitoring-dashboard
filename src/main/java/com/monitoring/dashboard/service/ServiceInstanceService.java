package com.monitoring.dashboard.service;

import com.monitoring.dashboard.dto.ServiceActionRequest;
import com.monitoring.dashboard.dto.ServiceActionResponse;
import com.monitoring.dashboard.dto.ServiceInstanceDTO;
import com.monitoring.dashboard.model.DeploymentConfig;
import com.monitoring.dashboard.model.ProjectProfiles;
import com.monitoring.dashboard.model.ServiceInstance;
import com.monitoring.dashboard.repository.DeploymentConfigRepository;
import com.monitoring.dashboard.repository.ProjectEnvironmentRepository;
import com.monitoring.dashboard.repository.ServiceInstanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service layer for managing service instances.
 * Handles business logic for service instance operations and data transformations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ServiceInstanceService {

    private final ServiceInstanceRepository serviceInstanceRepository;
    private final ProjectEnvironmentRepository projectEnvironmentRepository;
    private final DeploymentConfigRepository deploymentConfigRepository;

    /**
     * Get all service instances.
     * NEW: Now includes services from deployment configs even if no service instances exist.
     */
    @Transactional(readOnly = true)
    public List<ServiceInstanceDTO> getAllServiceInstances() {
        log.info("Fetching all service instances (including deployment configs without instances)");
        return generateServiceInstancesFromDeploymentData(serviceInstanceRepository.findAllDeploymentData());
    }

    /**
     * Get service instance by ID.
     */
    @Transactional(readOnly = true)
    public ServiceInstanceDTO getServiceInstanceById(String id) {
        ServiceInstance instance = serviceInstanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service instance not found with id: " + id));
        return convertToDTO(instance);
    }

    /**
     * Get all service instances by service name.
     */
    @Transactional(readOnly = true)
    public List<ServiceInstanceDTO> getServiceInstancesByName(String serviceName) {
        return serviceInstanceRepository.findByServiceName(serviceName).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all service instances by profile (e.g., apacqa, emeauat).
     */
    @Transactional(readOnly = true)
    public List<ServiceInstanceDTO> getServiceInstancesByProfile(String profile) {
        return serviceInstanceRepository.findByProfile(profile).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all service instances by machine name.
     */
    @Transactional(readOnly = true)
    public List<ServiceInstanceDTO> getServiceInstancesByMachine(String machineName) {
        return serviceInstanceRepository.findByMachineName(machineName).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all service instances by infra type (linux, windows, ecs).
     */
    @Transactional(readOnly = true)
    public List<ServiceInstanceDTO> getServiceInstancesByInfraType(String infraType) {
        return serviceInstanceRepository.findByInfraType(infraType).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all service instances by status.
     */
    @Transactional(readOnly = true)
    public List<ServiceInstanceDTO> getServiceInstancesByStatus(String status) {
        return serviceInstanceRepository.findByStatus(status).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all service instances by project ID.
     * NEW: Now includes services from deployment configs even if no service instances exist.
     */
    @Transactional(readOnly = true)
    public List<ServiceInstanceDTO> getServiceInstancesByProject(Long projectId) {
        log.info("Fetching service instances for project ID: {} (including deployment configs without instances)", projectId);
        return generateServiceInstancesFromDeploymentData(
            serviceInstanceRepository.findDeploymentDataByProjectId(projectId)
        );
    }

    /**
     * Get service instances by profile and service name.
     */
    @Transactional(readOnly = true)
    public List<ServiceInstanceDTO> getServiceInstancesByProfileAndName(String profile, String serviceName) {
        return serviceInstanceRepository.findByProfileAndServiceName(profile, serviceName).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Create a new service instance.
     */
    @Transactional
    public ServiceInstanceDTO createServiceInstance(ServiceInstanceDTO dto) {
        if (serviceInstanceRepository.existsById(dto.getId())) {
            throw new RuntimeException("Service instance already exists with id: " + dto.getId());
        }

        // Validate that configId is provided
        if (dto.getConfigId() == null) {
            throw new RuntimeException("configId is required - service instances must be linked to a deployment config");
        }

        // Fetch the deployment config
        DeploymentConfig deploymentConfig = deploymentConfigRepository.findById(dto.getConfigId())
                .orElseThrow(() -> new RuntimeException("Deployment config not found with id: " + dto.getConfigId()));

        ServiceInstance instance = new ServiceInstance();
        instance.setInstanceId(dto.getId());
        instance.setDeploymentConfig(deploymentConfig);
        instance.setServiceName(dto.getServiceName());
        instance.setMachineName(dto.getMachineName());
        instance.setInfraType(dto.getInfraType());
        instance.setProfile(dto.getProfile());
        instance.setPort(dto.getPort());
        instance.setVersion(dto.getVersion());
        instance.setUptimeSeconds(dto.getUptime() != null ? dto.getUptime() * 60 : null);
        instance.setStatus(dto.getStatus());
        instance.setDeployedAt(dto.getDeployedAt());
        instance.setLastUpdated(dto.getLastUpdated());

        ServiceInstance saved = serviceInstanceRepository.save(instance);
        log.info("Created service instance: {} on {} linked to deployment config: {}",
                saved.getServiceName(), saved.getMachineName(), dto.getConfigId());
        return convertToDTO(saved);
    }

    /**
     * Update an existing service instance.
     */
    @Transactional
    public ServiceInstanceDTO updateServiceInstance(String id, ServiceInstanceDTO dto) {
        ServiceInstance instance = serviceInstanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service instance not found with id: " + id));

        instance.setServiceName(dto.getServiceName());
        instance.setMachineName(dto.getMachineName());
        instance.setInfraType(dto.getInfraType());
        instance.setProfile(dto.getProfile());
        instance.setPort(dto.getPort());
        instance.setVersion(dto.getVersion());
        instance.setUptimeSeconds(dto.getUptime() != null ? dto.getUptime() * 60 : null);
        instance.setStatus(dto.getStatus());
        instance.setDeployedAt(dto.getDeployedAt());
        instance.setLastUpdated(dto.getLastUpdated());

        ServiceInstance updated = serviceInstanceRepository.save(instance);
        log.info("Updated service instance: {} on {}", updated.getServiceName(), updated.getMachineName());
        return convertToDTO(updated);
    }

    /**
     * Delete a service instance.
     */
    @Transactional
    public void deleteServiceInstance(String id) {
        if (!serviceInstanceRepository.existsById(id)) {
            throw new RuntimeException("Service instance not found with id: " + id);
        }
        serviceInstanceRepository.deleteById(id);
        log.info("Deleted service instance with id: {}", id);
    }

    /**
     * Convert ServiceInstance entity to DTO.
     */
    private ServiceInstanceDTO convertToDTO(ServiceInstance instance) {
        ServiceInstanceDTO dto = new ServiceInstanceDTO();
        dto.setId(instance.getInstanceId());
        dto.setConfigId(instance.getDeploymentConfig() != null ? instance.getDeploymentConfig().getConfigId() : null);
        dto.setServiceName(instance.getServiceName());
        dto.setMachineName(instance.getMachineName());
        dto.setPort(instance.getPort());
        dto.setInfraType(instance.getInfraType());
        dto.setProfile(instance.getProfile());
        dto.setEnvType(determineEnvType(instance.getProfile()));
        // Convert uptime from seconds to minutes for frontend
        dto.setUptime(instance.getUptimeSeconds() != null ? instance.getUptimeSeconds() / 60 : null);
        dto.setVersion(instance.getVersion());
        dto.setStatus(instance.getStatus());
        dto.setDeployedAt(instance.getDeployedAt());
        dto.setLastUpdated(instance.getLastUpdated());

        // Generate log and metrics URLs
        dto.setLogURL(generateLogURL(instance.getMachineName(), instance.getServiceName(), instance.getInfraType()));
        dto.setMetricsURL(generateMetricsURL(instance.getMachineName(), instance.getServiceName(), instance.getInfraType(), instance.getPort()));

        return dto;
    }
    
    /**
     * Start multiple service instances.
     * Updates status to 'starting' initially, then simulates actual start and updates to 'running'.
     */
    @Transactional
    public List<ServiceActionResponse> startServiceInstances(ServiceActionRequest request) {
        List<ServiceActionResponse> responses = new ArrayList<>();
        
        for (String instanceId : request.getInstanceIds()) {
            try {
                ServiceInstance instance = serviceInstanceRepository.findById(instanceId)
                        .orElseThrow(() -> new RuntimeException("Service instance not found: " + instanceId));
                
                // Check if already running
                if ("running".equalsIgnoreCase(instance.getStatus())) {
                    responses.add(new ServiceActionResponse(
                            instanceId,
                            instance.getServiceName(),
                            false,
                            "Service is already running",
                            "running"
                    ));
                    continue;
                }
                
                // Set status to starting
                instance.setStatus("starting");
                serviceInstanceRepository.save(instance);
                log.info("Starting service instance: {} ({})", instance.getServiceName(), instanceId);
                
                // Simulate actual start operation
                // In a real implementation, this would call the actual service management API
                // For now, we'll simulate a quick operation and set to running
                try {
                    // Simulate start delay (100-500ms)
                    Thread.sleep(100 + (long)(Math.random() * 400));
                    
                    // Update to running status
                    instance.setStatus("running");
                    instance.setUptimeSeconds(0); // Reset uptime
                    serviceInstanceRepository.save(instance);
                    
                    responses.add(new ServiceActionResponse(
                            instanceId,
                            instance.getServiceName(),
                            true,
                            "Service started successfully",
                            "running"
                    ));
                    log.info("Successfully started service instance: {} ({})", instance.getServiceName(), instanceId);
                    
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    instance.setStatus("degraded");
                    serviceInstanceRepository.save(instance);
                    responses.add(new ServiceActionResponse(
                            instanceId,
                            instance.getServiceName(),
                            false,
                            "Failed to start service: " + e.getMessage(),
                            "degraded"
                    ));
                }
                
            } catch (Exception e) {
                log.error("Error starting service instance {}: {}", instanceId, e.getMessage());
                responses.add(new ServiceActionResponse(
                        instanceId,
                        "Unknown",
                        false,
                        "Error: " + e.getMessage(),
                        null
                ));
            }
        }
        
        return responses;
    }
    
    /**
     * Stop multiple service instances.
     * Updates status to 'stopping' initially, then simulates actual stop and updates to 'stopped'.
     */
    @Transactional
    public List<ServiceActionResponse> stopServiceInstances(ServiceActionRequest request) {
        List<ServiceActionResponse> responses = new ArrayList<>();
        
        for (String instanceId : request.getInstanceIds()) {
            try {
                ServiceInstance instance = serviceInstanceRepository.findById(instanceId)
                        .orElseThrow(() -> new RuntimeException("Service instance not found: " + instanceId));
                
                // Check if already stopped
                if ("stopped".equalsIgnoreCase(instance.getStatus())) {
                    responses.add(new ServiceActionResponse(
                            instanceId,
                            instance.getServiceName(),
                            false,
                            "Service is already stopped",
                            "stopped"
                    ));
                    continue;
                }
                
                // Set status to stopping
                instance.setStatus("stopping");
                serviceInstanceRepository.save(instance);
                log.info("Stopping service instance: {} ({})", instance.getServiceName(), instanceId);
                
                // Simulate actual stop operation
                // In a real implementation, this would call the actual service management API
                // For now, we'll simulate a quick operation and set to stopped
                try {
                    // Simulate stop delay (100-500ms)
                    Thread.sleep(100 + (long)(Math.random() * 400));
                    
                    // Update to stopped status
                    instance.setStatus("stopped");
                    instance.setUptimeSeconds(0); // Reset uptime
                    serviceInstanceRepository.save(instance);
                    
                    responses.add(new ServiceActionResponse(
                            instanceId,
                            instance.getServiceName(),
                            true,
                            "Service stopped successfully",
                            "stopped"
                    ));
                    log.info("Successfully stopped service instance: {} ({})", instance.getServiceName(), instanceId);
                    
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    instance.setStatus("degraded");
                    serviceInstanceRepository.save(instance);
                    responses.add(new ServiceActionResponse(
                            instanceId,
                            instance.getServiceName(),
                            false,
                            "Failed to stop service: " + e.getMessage(),
                            "degraded"
                    ));
                }
                
            } catch (Exception e) {
                log.error("Error stopping service instance {}: {}", instanceId, e.getMessage());
                responses.add(new ServiceActionResponse(
                        instanceId,
                        "Unknown",
                        false,
                        "Error: " + e.getMessage(),
                        null
                ));
            }
        }
        
        return responses;
    }
    
    /**
     * Determine environment type from profile code by looking up ProjectProfiles.
     * Uses the actual envCode from the ProjectProfiles entity rather than parsing the profile string.
     * DEV: dev
     * STAGING: qa, uat, dailyrefresh profiles
     * PROD: prod profiles
     * COB: cob profiles
     */
    private String determineEnvType(String profileCode) {
        if (profileCode == null) {
            return "STAGING"; // default
        }
        
        // Look up the ProjectProfiles by profileCode to get the actual envCode
        List<ProjectProfiles> environments = projectEnvironmentRepository.findByProfileCode(profileCode);

        if (!environments.isEmpty()) {
            ProjectProfiles env = environments.get(0); // Get first matching environment
            if (env.getEnvCode() != null) {
                return env.getEnvCode(); // Returns DEV, STAGING, PROD, or COB
            }
        }

        // Fallback to string matching if no ProjectProfiles found (backward compatibility)
        String lowerProfile = profileCode.toLowerCase();
        
        if (lowerProfile.equals("dev")) {
            return "DEV";
        } else if (lowerProfile.endsWith("prod")) {
            return "PROD";
        } else if (lowerProfile.endsWith("cob")) {
            return "COB";
        } else {
            // qa, uat, dailyrefresh all belong to STAGING
            return "STAGING";
        }
    }

    /**
     * Generate ServiceInstanceDTO list from deployment data query results.
     * This method processes the joined data from components, deployment configs, infrastructure, and service instances.
     * If no deployment config exists, it creates a placeholder DTO from component data.
     * If deployment config exists but no service instance, it creates a placeholder from deployment config.
     */
    private List<ServiceInstanceDTO> generateServiceInstancesFromDeploymentData(List<Object[]> deploymentData) {
        List<ServiceInstanceDTO> results = new ArrayList<>();

        for (Object[] row : deploymentData) {
            ServiceInstanceDTO dto = new ServiceInstanceDTO();

            // Component data (indices 0-3) - always present
            Long componentId = (Long) row[0];
            String componentName = (String) row[1];
            String description = (String) row[2];
            String module = (String) row[3];

            // Deployment Config data (indices 4-6) - may be null if no deployment config
            Long configId = (Long) row[4];
            Integer basePort = (Integer) row[5];
            Boolean enabled = (Boolean) row[6];

            // Infrastructure data (indices 7-11) - may be null if no deployment config
            Long infraId = (Long) row[7];
            String hostname = (String) row[8];
            String infraType = (String) row[9];
            String environment = (String) row[10];
            String region = (String) row[11];

            // Profile data (index 12) - may be null
            String profileCode = (String) row[12];

            // Service Instance data (indices 13-22) - may be null if no instance exists
            String instanceId = (String) row[13];
            String serviceName = (String) row[14];
            String machineName = (String) row[15];
            Integer port = (Integer) row[16];
            String profile = (String) row[17];
            String version = (String) row[18];
            Integer uptimeSeconds = (Integer) row[19];
            String status = (String) row[20];
            Object deployedAt = row[21];
            Object lastUpdated = row[22];

            // If no deployment config exists, skip this component (cannot deploy without config)
            if (configId == null) {
                log.debug("Component '{}' has no deployment config, skipping", componentName);
                continue;
            }

            // Set config ID
            dto.setConfigId(configId);

            // If service instance exists, use its data
            if (instanceId != null) {
                dto.setId(instanceId);
                dto.setServiceName(serviceName);
                dto.setMachineName(machineName);
                dto.setPort(port);
                dto.setProfile(profile);
                dto.setVersion(version);
                dto.setUptime(uptimeSeconds != null ? uptimeSeconds / 60 : null);
                dto.setStatus(status);
                dto.setDeployedAt(deployedAt != null ? (java.time.LocalDateTime) deployedAt : null);
                dto.setLastUpdated(lastUpdated != null ? (java.time.LocalDateTime) lastUpdated : null);
            } else {
                // No service instance exists - generate placeholder data from deployment config
                dto.setId(generatePlaceholderId(componentId, infraId));
                dto.setServiceName(componentName);
                dto.setMachineName(hostname);
                dto.setPort(basePort);
                dto.setProfile(profileCode != null ? profileCode : deriveProfileFromEnvironment(environment, region));
                dto.setVersion(null);
                dto.setUptime(null);
                dto.setStatus("not-deployed"); // Special status to indicate no instance exists
                dto.setDeployedAt(null);
                dto.setLastUpdated(null);
            }

            // Set infrastructure type and environment type
            dto.setInfraType(infraType);
            dto.setEnvType(determineEnvType(dto.getProfile()));

            // Generate log and metrics URLs
            dto.setLogURL(generateLogURL(hostname, dto.getServiceName(), infraType));
            dto.setMetricsURL(generateMetricsURL(hostname, dto.getServiceName(), infraType, dto.getPort()));

            results.add(dto);
        }

        log.info("Generated {} service instance DTOs from deployment data", results.size());
        return results;
    }

    /**
     * Generate a placeholder instance ID for deployment configs without service instances.
     */
    private String generatePlaceholderId(Long componentId, Long infraId) {
        return String.format("placeholder-%d-%d", componentId, infraId);
    }

    /**
     * Derive profile code from environment and region when no profile is configured.
     */
    private String deriveProfileFromEnvironment(String environment, String region) {
        if (environment == null || region == null) {
            return "default";
        }

        String regionPrefix = switch (region.toLowerCase()) {
            case "apac", "ap", "asia" -> "apac";
            case "emea", "eu", "europe" -> "emea";
            case "nam", "na", "americas" -> "nam";
            default -> region.toLowerCase();
        };

        String envSuffix = switch (environment.toLowerCase()) {
            case "dev", "development" -> "dev";
            case "qa", "qat", "test" -> "qa";
            case "uat", "staging" -> "uat";
            case "prod", "production" -> "prod";
            default -> environment.toLowerCase();
        };

        return regionPrefix + envSuffix;
    }

    /**
     * Generate log URL based on infrastructure type and service.
     */
    private String generateLogURL(String hostname, String serviceName, String infraType) {
        if ("ecs".equalsIgnoreCase(infraType)) {
            return String.format("https://logs.example.com/cloudwatch/%s/%s", hostname, serviceName);
        } else {
            return String.format("https://logs.example.com/splunk/%s/%s", hostname, serviceName);
        }
    }

    /**
     * Generate metrics URL based on infrastructure type and service.
     */
    private String generateMetricsURL(String hostname, String serviceName, String infraType, Integer port) {
        if ("ecs".equalsIgnoreCase(infraType)) {
            return String.format("https://metrics.example.com/prometheus/%s/%s", hostname, serviceName);
        } else if (port != null) {
            return String.format("http://%s:%d/actuator/metrics", hostname, port);
        } else {
            return String.format("https://metrics.example.com/grafana/%s/%s", hostname, serviceName);
        }
    }
}
