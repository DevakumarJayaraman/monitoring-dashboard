package com.monitoring.dashboard.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.monitoring.dashboard.dto.ComponentDTO;
import com.monitoring.dashboard.dto.ComponentWithServicesDTO;
import com.monitoring.dashboard.model.Component;
import com.monitoring.dashboard.model.DeploymentConfig;
import com.monitoring.dashboard.model.ServiceInstance;
import com.monitoring.dashboard.model.ProjectEnvironmentMapping;
import com.monitoring.dashboard.model.ProjectProfiles;
import com.monitoring.dashboard.repository.ComponentRepository;
import com.monitoring.dashboard.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
@Slf4j
public class ComponentService {
    private final ComponentRepository componentRepository;
    private final ProjectRepository projectRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<ComponentDTO> getAllComponents() {
        return componentRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ComponentDTO getComponentById(Long id) {
        Component component = componentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Component not found with id: " + id));
        return convertToDTO(component);
    }

    @Transactional(readOnly = true)
    public ComponentDTO getComponentByName(String name) {
        Component component = componentRepository.findByComponentName(name)
                .orElseThrow(() -> new RuntimeException("Component not found with name: " + name));
        return convertToDTO(component);
    }

    @Transactional(readOnly = true)
    public List<ComponentDTO> getComponentsByModule(String module) {
        return componentRepository.findByModule(module).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ComponentDTO> getComponentsByProject(Long projectId) {
        return componentRepository.findByProject_ProjectId(projectId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ComponentDTO createComponent(ComponentDTO dto) {
        if (componentRepository.existsByComponentName(dto.getComponentName())) {
            throw new RuntimeException("Component already exists with name: " + dto.getComponentName());
        }
        if (dto.getProjectId() == null) {
            throw new RuntimeException("Project ID is required to create a component");
        }
        validateComponentDefaults(dto);
        Component component = new Component();
        component.setComponentName(dto.getComponentName());
        component.setDescription(dto.getDescription());
        component.setModule(dto.getModule());
        component.setDefaultInfraType(dto.getDefaultInfraType());
        component.setDefaultPort(dto.getDefaultPort());
        component.setProject(projectRepository.findById(dto.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + dto.getProjectId())));
        Component saved = componentRepository.save(component);
        log.info("Created component: {}", saved.getComponentName());
        return convertToDTO(saved);
    }

    @Transactional
    public ComponentDTO updateComponent(Long id, ComponentDTO dto) {
        Component component = componentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Component not found with id: " + id));
        validateComponentDefaults(dto);
        component.setComponentName(dto.getComponentName());
        component.setDescription(dto.getDescription());
        component.setModule(dto.getModule());
        component.setDefaultInfraType(dto.getDefaultInfraType());
        component.setDefaultPort(dto.getDefaultPort());
        if (dto.getProjectId() != null) {
            component.setProject(projectRepository.findById(dto.getProjectId())
                    .orElseThrow(() -> new RuntimeException("Project not found with id: " + dto.getProjectId())));
        }
        Component updated = componentRepository.save(component);
        log.info("Updated component: {}", updated.getComponentName());
        return convertToDTO(updated);
    }

    @Transactional
    public void deleteComponent(Long id) {
        if (!componentRepository.existsById(id)) {
            throw new RuntimeException("Component not found with id: " + id);
        }
        componentRepository.deleteById(id);
        log.info("Deleted component with id: {}", id);
    }

    @Transactional(readOnly = true)
    public List<ComponentWithServicesDTO> getComponentsWithServicesByProjectId(Long projectId) {
        List<Component> components = componentRepository.findByProject_ProjectId(projectId);
        return components.stream()
                .map(this::convertToComponentWithServicesDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ComponentWithServicesDTO getComponentWithServicesById(Long id) {
        Component component = componentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Component not found with id: " + id));
        return convertToComponentWithServicesDTO(component);
    }

    private ComponentDTO convertToDTO(Component component) {
        ComponentDTO dto = new ComponentDTO();
        dto.setComponentId(component.getComponentId());
        dto.setComponentName(component.getComponentName());
        dto.setDescription(component.getDescription());
        dto.setModule(component.getModule());

        // Add project information
        if (component.getProject() != null) {
            dto.setProjectId(component.getProject().getProjectId());
            dto.setProjectName(component.getProject().getProjectName());
        }
        dto.setDefaultInfraType(component.getDefaultInfraType());
        dto.setDefaultPort(component.getDefaultPort());
        // Set totalDeployments from deploymentConfigs
        dto.setTotalDeployments(component.getDeploymentConfigs() != null ? component.getDeploymentConfigs().size() : 0);
        return dto;
    }

    private ComponentWithServicesDTO convertToComponentWithServicesDTO(Component component) {
        ComponentWithServicesDTO dto = new ComponentWithServicesDTO();
        dto.setComponentId(component.getComponentId());
        dto.setComponentName(component.getComponentName());
        dto.setDescription(component.getDescription());
        dto.setModule(component.getModule());

        if (component.getProject() != null) {
            dto.setProjectId(component.getProject().getProjectId());
            dto.setProjectName(component.getProject().getProjectName());
        }
        dto.setDefaultInfraType(component.getDefaultInfraType());
        dto.setDefaultPort(component.getDefaultPort());

        // Convert service instances - now fetched through deployment configs
        List<ComponentWithServicesDTO.ServiceInstanceDTO> serviceInstanceDTOs = new ArrayList<>();
        List<com.monitoring.dashboard.dto.DeploymentConfigDTO> deploymentConfigDTOs = new ArrayList<>();
        if (component.getDeploymentConfigs() != null) {
            for (DeploymentConfig config : component.getDeploymentConfigs()) {
                // Add deployment config DTO
                com.monitoring.dashboard.dto.DeploymentConfigDTO dcDto = new com.monitoring.dashboard.dto.DeploymentConfigDTO();
                dcDto.setConfigId(config.getConfigId());
                dcDto.setComponentId(component.getComponentId());
                dcDto.setInfraId(config.getInfrastructure() != null ? config.getInfrastructure().getInfraId() : null);
                dcDto.setBasePort(config.getBasePort());
                dcDto.setEnabled(config.getEnabled());
                dcDto.setVersion(config.getVersion());

                // Resolve profile code from mapped ProjectProfiles or infra mapping
                String profileCode = null;
                if (config.getProfile() != null && config.getProfile().getProfileCode() != null) {
                    profileCode = config.getProfile().getProfileCode();
                } else if (config.getInfrastructure() != null && config.getInfrastructure().getProjectEnvironmentMapping() != null) {
                    ProjectEnvironmentMapping pem = config.getInfrastructure().getProjectEnvironmentMapping();
                    if (pem.getProfiles() != null && !pem.getProfiles().isEmpty()) {
                        // prefer ACTIVE
                        for (ProjectProfiles p : pem.getProfiles()) {
                            if ("ACTIVE".equalsIgnoreCase(p.getStatus())) {
                                profileCode = p.getProfileCode();
                                break;
                            }
                        }
                        if (profileCode == null) profileCode = pem.getProfiles().get(0).getProfileCode();
                    }
                }
                dcDto.setProfile(profileCode);

                // Deserialize deployParams blob to Map
                if (config.getDeployParams() != null && config.getDeployParams().length > 0) {
                    try {
                        String json = new String(config.getDeployParams());
                        Map<String, String> params = objectMapper.readValue(json, new TypeReference<>() {});
                        dcDto.setDeployParams(params);
                    } catch (Exception e) {
                        log.warn("Failed to parse deployParams for config {}", config.getConfigId(), e);
                        dcDto.setDeployParams(Map.of());
                    }
                } else {
                    dcDto.setDeployParams(Map.of());
                }

                deploymentConfigDTOs.add(dcDto);

                if (config.getServiceInstances() != null) {
                    for (ServiceInstance si : config.getServiceInstances()) {
                        serviceInstanceDTOs.add(new ComponentWithServicesDTO.ServiceInstanceDTO(
                                si.getInstanceId(),
                                si.getServiceName(),
                                si.getMachineName(),
                                si.getInfraType(),
                                si.getProfile(),
                                si.getVersion(),
                                si.getPort(),
                                si.getUptimeSeconds(),
                                si.getStatus(),
                                null,
                                null
                        ));
                    }
                }
            }
        }

        dto.setServiceInstances(serviceInstanceDTOs);
        dto.setServiceInstanceCount(serviceInstanceDTOs.size());
        dto.setDeploymentConfigs(deploymentConfigDTOs);

        return dto;
    }

    private void validateComponentDefaults(ComponentDTO dto) {
        if (dto.getDefaultInfraType() == null || dto.getDefaultInfraType().isBlank()) {
            dto.setDefaultInfraType(null);
        } else {
            String type = dto.getDefaultInfraType().toLowerCase();
            if (!type.equals("linux") && !type.equals("windows") && !type.equals("ecs")) {
                throw new RuntimeException("Default infrastructure type must be one of linux, windows, or ecs");
            }
            dto.setDefaultInfraType(type);
        }
        if (dto.getDefaultPort() != null) {
            if (dto.getDefaultPort() <= 0 || dto.getDefaultPort() > 65535) {
                throw new RuntimeException("Default port must be between 1 and 65535");
            }
        }
    }
}
