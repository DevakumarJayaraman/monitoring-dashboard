package com.monitoring.dashboard.service;

import com.monitoring.dashboard.dto.InfrastructureDTO;
import com.monitoring.dashboard.model.Infrastructure;
import com.monitoring.dashboard.model.InfraResourceLimit;
import com.monitoring.dashboard.model.InfraUsageMetric;
import com.monitoring.dashboard.repository.InfraResourceLimitRepository;
import com.monitoring.dashboard.repository.InfraUsageMetricRepository;
import com.monitoring.dashboard.repository.InfrastructureRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InfrastructureService {

    private final InfrastructureRepository infrastructureRepository;
    private final InfraResourceLimitRepository resourceLimitRepository;
    private final InfraUsageMetricRepository usageMetricRepository;

    @Transactional(readOnly = true)
    public List<InfrastructureDTO> getAllInfrastructure() {
        return infrastructureRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InfrastructureDTO getInfrastructureById(Long id) {
        Infrastructure infra = infrastructureRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Infrastructure not found with id: " + id));
        return convertToDTO(infra);
    }

    @Transactional(readOnly = true)
    public InfrastructureDTO getInfrastructureByName(String name) {
        Infrastructure infra = infrastructureRepository.findByInfraName(name)
                .orElseThrow(() -> new RuntimeException("Infrastructure not found with name: " + name));
        return convertToDTO(infra);
    }

    @Transactional(readOnly = true)
    public List<InfrastructureDTO> getInfrastructureByType(String type) {
        return infrastructureRepository.findByInfraType(type).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InfrastructureDTO> getInfrastructureByEnvironment(String environment) {
        return infrastructureRepository.findByEnvironment(environment).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public InfrastructureDTO createInfrastructure(InfrastructureDTO dto) {
        if (infrastructureRepository.existsByInfraName(dto.getInfraName())) {
            throw new RuntimeException("Infrastructure already exists with name: " + dto.getInfraName());
        }

        Infrastructure infra = new Infrastructure();
        infra.setInfraName(dto.getInfraName());
        infra.setInfraType(dto.getInfraType());
        infra.setHostname(dto.getHostname());
        infra.setIpAddress(dto.getIpAddress());
        infra.setEnvironment(dto.getEnvironment());

        Infrastructure saved = infrastructureRepository.save(infra);
        
        // Add resource limits if provided
        if (dto.getResourceLimits() != null) {
            for (InfrastructureDTO.ResourceLimitDTO limitDTO : dto.getResourceLimits()) {
                InfraResourceLimit limit = new InfraResourceLimit();
                limit.setInfrastructure(saved);
                limit.setResourceName(limitDTO.getResourceName());
                limit.setLimitValue(limitDTO.getLimitValue());
                limit.setUnit(limitDTO.getUnit());
                resourceLimitRepository.save(limit);
            }
        }

        log.info("Created infrastructure: {}", saved.getInfraName());
        return convertToDTO(saved);
    }

    @Transactional
    public InfrastructureDTO updateInfrastructure(Long id, InfrastructureDTO dto) {
        Infrastructure infra = infrastructureRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Infrastructure not found with id: " + id));

        infra.setInfraName(dto.getInfraName());
        infra.setInfraType(dto.getInfraType());
        infra.setHostname(dto.getHostname());
        infra.setIpAddress(dto.getIpAddress());
        infra.setEnvironment(dto.getEnvironment());

        Infrastructure updated = infrastructureRepository.save(infra);
        log.info("Updated infrastructure: {}", updated.getInfraName());
        return convertToDTO(updated);
    }

    @Transactional
    public void deleteInfrastructure(Long id) {
        if (!infrastructureRepository.existsById(id)) {
            throw new RuntimeException("Infrastructure not found with id: " + id);
        }
        infrastructureRepository.deleteById(id);
        log.info("Deleted infrastructure with id: {}", id);
    }

    private InfrastructureDTO convertToDTO(Infrastructure infra) {
        InfrastructureDTO dto = new InfrastructureDTO();
        dto.setInfraId(infra.getInfraId());
        dto.setInfraName(infra.getInfraName());
        dto.setInfraType(infra.getInfraType());
        dto.setHostname(infra.getHostname());
        dto.setIpAddress(infra.getIpAddress());
        dto.setEnvironment(infra.getEnvironment());

        // Add resource limits
        List<InfraResourceLimit> limits = resourceLimitRepository.findByInfrastructure_InfraId(infra.getInfraId());
        dto.setResourceLimits(limits.stream()
                .map(limit -> new InfrastructureDTO.ResourceLimitDTO(
                        limit.getLimitId(),
                        limit.getResourceName(),
                        limit.getLimitValue(),
                        limit.getUnit()
                ))
                .collect(Collectors.toList()));

        // Add current metrics (today's latest)
        List<InfraUsageMetric> metrics = usageMetricRepository.findLatestMetricsForInfra(
                infra.getInfraId(), LocalDate.now());
        dto.setCurrentMetrics(metrics.stream()
                .map(metric -> new InfrastructureDTO.UsageMetricDTO(
                        metric.getMetricId(),
                        metric.getMetricName(),
                        metric.getMetricValue(),
                        metric.getUnit(),
                        metric.getMetricTime().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
                ))
                .collect(Collectors.toList()));

        return dto;
    }
}
