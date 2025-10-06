package com.monitoring.dashboard.service;

import com.monitoring.dashboard.dto.ComponentDTO;
import com.monitoring.dashboard.model.Component;
import com.monitoring.dashboard.repository.ComponentRepository;
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

    @Transactional
    public ComponentDTO createComponent(ComponentDTO dto) {
        if (componentRepository.existsByComponentName(dto.getComponentName())) {
            throw new RuntimeException("Component already exists with name: " + dto.getComponentName());
        }
        Component component = new Component();
        component.setComponentName(dto.getComponentName());
        component.setDescription(dto.getDescription());
        component.setModule(dto.getModule());
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
}
