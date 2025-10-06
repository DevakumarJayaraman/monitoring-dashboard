package com.monitoring.dashboard.service;

import com.monitoring.dashboard.dto.ServiceInstanceDTO;
import com.monitoring.dashboard.model.ProjectEnvironment;
import com.monitoring.dashboard.model.ServiceInstance;
import com.monitoring.dashboard.repository.ProjectEnvironmentRepository;
import com.monitoring.dashboard.repository.ServiceInstanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
