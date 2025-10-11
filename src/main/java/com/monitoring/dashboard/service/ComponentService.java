package com.monitoring.dashboard.service;

import com.monitoring.dashboard.dto.ComponentDTO;
import com.monitoring.dashboard.dto.ComponentWithServicesDTO;
import com.monitoring.dashboard.model.Component;
import com.monitoring.dashboard.repository.ComponentRepository;
import com.monitoring.dashboard.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
@Slf4j
public class ComponentService {
    private final ComponentRepository componentRepository;
    private final ProjectRepository projectRepository;

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
        Component component = new Component();
        component.setComponentName(dto.getComponentName());
        component.setDescription(dto.getDescription());
        component.setModule(dto.getModule());
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
        component.setComponentName(dto.getComponentName());
        component.setDescription(dto.getDescription());
        component.setModule(dto.getModule());
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

        dto.setTotalDeployments(component.getDeployments() != null ? component.getDeployments().size() : 0);
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

        // Convert service instances
        List<ComponentWithServicesDTO.ServiceInstanceDTO> serviceInstanceDTOs =
                component.getServiceInstances().stream()
                        .map(si -> new ComponentWithServicesDTO.ServiceInstanceDTO(
                                si.getInstanceId(),
                                si.getServiceName(),
                                si.getMachineName(),
                                si.getInfraType(),
                                si.getProfile(),
                                si.getVersion(),
                                si.getPort(),
                                si.getUptimeSeconds(),
                                si.getStatus(),
                                si.getLogUrl(),
                                si.getMetricsUrl()
                        ))
                        .collect(Collectors.toList());

        dto.setServiceInstances(serviceInstanceDTOs);
        dto.setServiceInstanceCount(serviceInstanceDTOs.size());

        return dto;
    }
}
