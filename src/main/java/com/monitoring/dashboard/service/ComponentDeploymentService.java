package com.monitoring.dashboard.service;

import com.monitoring.dashboard.dto.ComponentDeploymentDTO;
import com.monitoring.dashboard.dto.CreateComponentDeploymentBatchRequest;
import com.monitoring.dashboard.model.Component;
import com.monitoring.dashboard.model.ComponentDeployment;
import com.monitoring.dashboard.model.Infrastructure;
import com.monitoring.dashboard.repository.ComponentDeploymentRepository;
import com.monitoring.dashboard.repository.ComponentRepository;
import com.monitoring.dashboard.repository.InfrastructureRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ComponentDeploymentService {

    private final ComponentDeploymentRepository componentDeploymentRepository;
    private final ComponentRepository componentRepository;
    private final InfrastructureRepository infrastructureRepository;

    @Transactional(readOnly = true)
    public List<ComponentDeploymentDTO> getDeploymentsByProject(Long projectId) {
        if (projectId == null) {
            return componentDeploymentRepository.findAll().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        }

        return componentDeploymentRepository.findByComponent_Project_ProjectId(projectId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<ComponentDeploymentDTO> createDeployments(CreateComponentDeploymentBatchRequest request) {
        List<ComponentDeploymentDTO> created = new ArrayList<>();

        for (CreateComponentDeploymentBatchRequest.DeploymentMapping mapping : request.getDeployments()) {
            Component component = componentRepository.findById(mapping.getComponentId())
                    .orElseThrow(() -> new RuntimeException("Component not found with id: " + mapping.getComponentId()));

            Infrastructure infrastructure = infrastructureRepository.findById(mapping.getInfraId())
                    .orElseThrow(() -> new RuntimeException("Infrastructure not found with id: " + mapping.getInfraId()));

            Optional<ComponentDeployment> existing = componentDeploymentRepository.findByComponentAndInfraAndProfile(
                    component.getComponentId(), infrastructure.getInfraId(), mapping.getProfile()
            );

            if (existing.isPresent()) {
                log.warn("Deployment mapping already exists for component {}, infra {}, profile {}",
                        component.getComponentId(), infrastructure.getInfraId(), mapping.getProfile());
                throw new RuntimeException("Deployment mapping already exists for the selected service, infrastructure, and profile");
            }

            ComponentDeployment deployment = new ComponentDeployment();
            deployment.setComponent(component);
            deployment.setInfrastructure(infrastructure);
            deployment.setProfile(mapping.getProfile());
            deployment.setPort(mapping.getPort());
            deployment.setComponentVersion(mapping.getComponentVersion());
            deployment.setStatus(mapping.getStatus());
            deployment.setUptimeSeconds(mapping.getUptimeSeconds());

            ComponentDeployment saved = componentDeploymentRepository.save(deployment);
            created.add(convertToDTO(saved));
        }

        return created;
    }

    private ComponentDeploymentDTO convertToDTO(ComponentDeployment deployment) {
        ComponentDeploymentDTO dto = new ComponentDeploymentDTO();
        dto.setMappingId(deployment.getMappingId());
        dto.setComponentId(deployment.getComponent().getComponentId());
        dto.setComponentName(deployment.getComponent().getComponentName());
        dto.setInfraId(deployment.getInfrastructure().getInfraId());
        dto.setInfraType(deployment.getInfrastructure().getInfraType());
        dto.setProfile(deployment.getProfile());
        dto.setPort(deployment.getPort());
        dto.setHostname(deployment.getInfrastructure().getHostname());
        return dto;
    }
}
