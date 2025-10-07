package com.monitoring.dashboard.service;

import com.monitoring.dashboard.dto.ServiceActionRequest;
import com.monitoring.dashboard.dto.ServiceActionResponse;
import com.monitoring.dashboard.dto.ServiceInstanceDTO;
import com.monitoring.dashboard.model.ProjectEnvironment;
import com.monitoring.dashboard.model.ServiceInstance;
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

    /**
     * Get all service instances.
     */
    @Transactional(readOnly = true)
    public List<ServiceInstanceDTO> getAllServiceInstances() {
        return serviceInstanceRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
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

        ServiceInstance instance = new ServiceInstance();
        instance.setInstanceId(dto.getId());
        instance.setServiceName(dto.getServiceName());
        instance.setMachineName(dto.getMachineName());
        instance.setInfraType(dto.getInfraType());
        instance.setProfile(dto.getProfile());
        instance.setPort(dto.getPort());
        instance.setVersion(dto.getVersion());
        instance.setUptimeSeconds(dto.getUptime() != null ? dto.getUptime() * 60 : null);
        instance.setStatus(dto.getStatus());
        instance.setLogUrl(dto.getLogURL());
        instance.setMetricsUrl(dto.getMetricsURL());

        ServiceInstance saved = serviceInstanceRepository.save(instance);
        log.info("Created service instance: {} on {}", saved.getServiceName(), saved.getMachineName());
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
        instance.setLogUrl(dto.getLogURL());
        instance.setMetricsUrl(dto.getMetricsURL());

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
        dto.setServiceName(instance.getServiceName());
        dto.setMachineName(instance.getMachineName());
        dto.setPort(instance.getPort());
        dto.setInfraType(instance.getInfraType());
        dto.setProfile(instance.getProfile());
        dto.setEnvType(determineEnvType(instance.getProfile())); // Add environment type
        // Convert uptime from seconds to minutes for frontend
        dto.setUptime(instance.getUptimeSeconds() != null ? instance.getUptimeSeconds() / 60 : null);
        dto.setVersion(instance.getVersion());
        dto.setLogURL(instance.getLogUrl());
        dto.setMetricsURL(instance.getMetricsUrl());
        dto.setStatus(instance.getStatus());
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
     * Determine environment type from profile code by looking up ProjectEnvironment.
     * Uses the actual envCode from the ProjectEnvironment entity rather than parsing the profile string.
     * DEV: dev
     * STAGING: qa, uat, dailyrefresh profiles
     * PROD: prod profiles
     * COB: cob profiles
     */
    private String determineEnvType(String profileCode) {
        if (profileCode == null) {
            return "STAGING"; // default
        }
        
        // Look up the ProjectEnvironment by profileCode to get the actual envCode
        List<ProjectEnvironment> environments = projectEnvironmentRepository.findByProfileCode(profileCode);
        
        if (!environments.isEmpty()) {
            ProjectEnvironment env = environments.get(0); // Get first matching environment
            if (env.getEnvCode() != null) {
                return env.getEnvCode(); // Returns DEV, STAGING, PROD, or COB
            }
        }
        
        // Fallback to string matching if no ProjectEnvironment found (backward compatibility)
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
}
