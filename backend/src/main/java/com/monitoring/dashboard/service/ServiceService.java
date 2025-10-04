package com.monitoring.dashboard.service;

import com.monitoring.dashboard.dto.ServiceDTO;
import com.monitoring.dashboard.model.Service;
import com.monitoring.dashboard.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
@Slf4j
public class ServiceService {

    private final ServiceRepository serviceRepository;

    @Transactional(readOnly = true)
    public List<ServiceDTO> getAllServices() {
        return serviceRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ServiceDTO getServiceById(Long id) {
        Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found with id: " + id));
        return convertToDTO(service);
    }

    @Transactional(readOnly = true)
    public ServiceDTO getServiceByName(String name) {
        Service service = serviceRepository.findByServiceName(name)
                .orElseThrow(() -> new RuntimeException("Service not found with name: " + name));
        return convertToDTO(service);
    }

    @Transactional(readOnly = true)
    public List<ServiceDTO> getServicesByTeam(String team) {
        return serviceRepository.findByOwningTeam(team).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ServiceDTO createService(ServiceDTO dto) {
        if (serviceRepository.existsByServiceName(dto.getServiceName())) {
            throw new RuntimeException("Service already exists with name: " + dto.getServiceName());
        }

        Service service = new Service();
        service.setServiceName(dto.getServiceName());
        service.setDescription(dto.getDescription());
        service.setOwningTeam(dto.getOwningTeam());

        Service saved = serviceRepository.save(service);
        log.info("Created service: {}", saved.getServiceName());
        return convertToDTO(saved);
    }

    @Transactional
    public ServiceDTO updateService(Long id, ServiceDTO dto) {
        Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found with id: " + id));

        service.setServiceName(dto.getServiceName());
        service.setDescription(dto.getDescription());
        service.setOwningTeam(dto.getOwningTeam());

        Service updated = serviceRepository.save(service);
        log.info("Updated service: {}", updated.getServiceName());
        return convertToDTO(updated);
    }

    @Transactional
    public void deleteService(Long id) {
        if (!serviceRepository.existsById(id)) {
            throw new RuntimeException("Service not found with id: " + id);
        }
        serviceRepository.deleteById(id);
        log.info("Deleted service with id: {}", id);
    }

    private ServiceDTO convertToDTO(Service service) {
        ServiceDTO dto = new ServiceDTO();
        dto.setServiceId(service.getServiceId());
        dto.setServiceName(service.getServiceName());
        dto.setDescription(service.getDescription());
        dto.setOwningTeam(service.getOwningTeam());
        dto.setTotalDeployments(service.getDeployments() != null ? service.getDeployments().size() : 0);
        return dto;
    }
}
