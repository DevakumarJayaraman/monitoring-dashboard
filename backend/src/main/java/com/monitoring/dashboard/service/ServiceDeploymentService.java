package com.monitoring.dashboard.service;

import com.monitoring.dashboard.dto.CreateDeploymentRequest;
import com.monitoring.dashboard.dto.ServiceDeploymentDTO;
import com.monitoring.dashboard.model.Infrastructure;
import com.monitoring.dashboard.model.Service;
import com.monitoring.dashboard.model.ServiceDeployment;
import com.monitoring.dashboard.repository.InfrastructureRepository;
import com.monitoring.dashboard.repository.ServiceDeploymentRepository;
import com.monitoring.dashboard.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
@Slf4j
public class ServiceDeploymentService {

    private final ServiceDeploymentRepository deploymentRepository;
    private final ServiceRepository serviceRepository;
    private final InfrastructureRepository infrastructureRepository;

    @Transactional(readOnly = true)
    public List<ServiceDeploymentDTO> getAllDeployments() {
        return deploymentRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ServiceDeploymentDTO getDeploymentById(Long id) {
        ServiceDeployment deployment = deploymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Deployment not found with id: " + id));
        return convertToDTO(deployment);
    }

    @Transactional(readOnly = true)
    public List<ServiceDeploymentDTO> getDeploymentsByInfrastructure(Long infraId) {
        return deploymentRepository.findByInfrastructure_InfraId(infraId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ServiceDeploymentDTO> getDeploymentsByService(Long serviceId) {
        return deploymentRepository.findByService_ServiceId(serviceId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ServiceDeploymentDTO> getDeploymentsByProfile(String profile) {
        return deploymentRepository.findByProfile(profile).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ServiceDeploymentDTO createDeployment(CreateDeploymentRequest request) {
        Service service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found with id: " + request.getServiceId()));

        Infrastructure infrastructure = infrastructureRepository.findByInfraName(request.getInfraName())
                .orElseThrow(() -> new RuntimeException("Infrastructure not found with name: " + request.getInfraName()));

        // Check if deployment already exists
        if (deploymentRepository.findByServiceAndInfraAndProfile(
                service.getServiceId(), 
                infrastructure.getInfraId(), 
                request.getProfile()).isPresent()) {
            throw new RuntimeException("Deployment already exists for this service, infrastructure, and profile");
        }

        ServiceDeployment deployment = new ServiceDeployment();
        deployment.setService(service);
        deployment.setInfrastructure(infrastructure);
        deployment.setProfile(request.getProfile());
        deployment.setPort(request.getPort());

        ServiceDeployment saved = deploymentRepository.save(deployment);
        log.info("Created deployment: service={}, infra={}, profile={}", 
                service.getServiceName(), infrastructure.getInfraName(), request.getProfile());
        return convertToDTO(saved);
    }

    @Transactional
    public ServiceDeploymentDTO updateDeployment(Long id, ServiceDeploymentDTO dto) {
        ServiceDeployment deployment = deploymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Deployment not found with id: " + id));

        deployment.setProfile(dto.getProfile());
        deployment.setPort(dto.getPort());

        ServiceDeployment updated = deploymentRepository.save(deployment);
        log.info("Updated deployment with id: {}", id);
        return convertToDTO(updated);
    }

    @Transactional
    public void deleteDeployment(Long id) {
        if (!deploymentRepository.existsById(id)) {
            throw new RuntimeException("Deployment not found with id: " + id);
        }
        deploymentRepository.deleteById(id);
        log.info("Deleted deployment with id: {}", id);
    }

    private ServiceDeploymentDTO convertToDTO(ServiceDeployment deployment) {
        ServiceDeploymentDTO dto = new ServiceDeploymentDTO();
        dto.setMappingId(deployment.getMappingId());
        dto.setServiceId(deployment.getService().getServiceId());
        dto.setServiceName(deployment.getService().getServiceName());
        dto.setInfraId(deployment.getInfrastructure().getInfraId());
        dto.setInfraName(deployment.getInfrastructure().getInfraName());
        dto.setInfraType(deployment.getInfrastructure().getInfraType());
        dto.setProfile(deployment.getProfile());
        dto.setPort(deployment.getPort());
        return dto;
    }
}
