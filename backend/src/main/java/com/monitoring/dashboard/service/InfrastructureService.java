package com.monitoring.dashboard.service;

import com.monitoring.dashboard.dto.InfraDetailDTO;
import com.monitoring.dashboard.dto.InfrastructureDTO;
import com.monitoring.dashboard.model.Infrastructure;
import com.monitoring.dashboard.model.InfraMetrics;
import com.monitoring.dashboard.repository.InfraMetricsRepository;
import com.monitoring.dashboard.repository.InfrastructureRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InfrastructureService {

    private final InfrastructureRepository infrastructureRepository;
    private final InfraMetricsRepository infraMetricsRepository;

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
        Infrastructure infra = infrastructureRepository.findByHostname(name)
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
        if (infrastructureRepository.existsByHostname(dto.getHostname())) {
            throw new RuntimeException("Infrastructure already exists with hostname: " + dto.getHostname());
        }

        Infrastructure infra = new Infrastructure();
        infra.setInfraType(dto.getInfraType());
        infra.setHostname(dto.getHostname());
        infra.setIpAddress(dto.getIpAddress());
        infra.setEnvironment(dto.getEnvironment());

        Infrastructure saved = infrastructureRepository.save(infra);
        
        // Add resource limits if provided
        if (dto.getResourceLimits() != null) {
            for (InfrastructureDTO.ResourceLimitDTO limitDTO : dto.getResourceLimits()) {
                InfraMetrics metric = new InfraMetrics();
                metric.setInfrastructure(saved);
                metric.setMetricName(limitDTO.getResourceName() + "_limit");
                metric.setMetricValue(limitDTO.getLimitValue());
                metric.setUnit(limitDTO.getUnit());
                infraMetricsRepository.save(metric);
            }
        }

        log.info("Created infrastructure: {}", saved.getHostname());
        return convertToDTO(saved);
    }

    @Transactional
    public InfrastructureDTO updateInfrastructure(Long id, InfrastructureDTO dto) {
        Infrastructure infra = infrastructureRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Infrastructure not found with id: " + id));

        infra.setInfraType(dto.getInfraType());
        infra.setHostname(dto.getHostname());
        infra.setIpAddress(dto.getIpAddress());
        infra.setEnvironment(dto.getEnvironment());

        Infrastructure updated = infrastructureRepository.save(infra);
        log.info("Updated infrastructure: {}", updated.getHostname());
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

    /**
     * Get all infrastructure with detailed metrics.
     */
    @Transactional(readOnly = true)
    public List<InfraDetailDTO> getAllInfrastructureDetails() {
        return infrastructureRepository.findAll().stream()
                .map(this::convertToDetailDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get infrastructure details by ID.
     */
    @Transactional(readOnly = true)
    public InfraDetailDTO getInfrastructureDetailsById(Long id) {
        Infrastructure infra = infrastructureRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Infrastructure not found with id: " + id));
        return convertToDetailDTO(infra);
    }

    /**
     * Get infrastructure details by type.
     */
    @Transactional(readOnly = true)
    public List<InfraDetailDTO> getInfrastructureDetailsByType(String type) {
        return infrastructureRepository.findByInfraType(type).stream()
                .map(this::convertToDetailDTO)
                .collect(Collectors.toList());
    }

    /**
     * Convert Infrastructure entity to detailed DTO with metrics.
     */
    private InfraDetailDTO convertToDetailDTO(Infrastructure infra) {
        InfraDetailDTO dto = new InfraDetailDTO();
        dto.setInfraId(infra.getInfraId());
        dto.setInfraType(infra.getInfraType());
        dto.setHostname(infra.getHostname());
        dto.setIpAddress(infra.getIpAddress());
        dto.setEnvironment(infra.getEnvironment());
        dto.setRegion(infra.getRegion());
        dto.setDatacenter(infra.getDatacenter());
        dto.setStatus(infra.getStatus());

        if (infra.getProject() != null) {
            dto.setProjectId(infra.getProject().getProjectId());
            dto.setProjectName(infra.getProject().getProjectName());
        }

        // Get all metrics for this infrastructure
        List<InfraMetrics> allMetrics = infraMetricsRepository.findByInfrastructure_InfraId(infra.getInfraId());
        
        // Separate into max metrics and used metrics
        Map<String, InfraMetrics> maxMetrics = allMetrics.stream()
                .filter(m -> m.getMetricName().endsWith("_max"))
                .collect(Collectors.toMap(InfraMetrics::getMetricName, m -> m));
        
        Map<String, InfraMetrics> usedMetrics = allMetrics.stream()
                .filter(m -> m.getMetricName().endsWith("_used"))
                .collect(Collectors.toMap(InfraMetrics::getMetricName, m -> m));

        // Build metrics based on infrastructure type
        String infraType = infra.getInfraType().toLowerCase();
        if ("ecs".equals(infraType)) {
            dto.setEcsMetrics(buildEcsMetrics(maxMetrics, usedMetrics));
        } else if ("linux".equals(infraType) || "windows".equals(infraType)) {
            dto.setVmMetrics(buildVmMetrics(maxMetrics, usedMetrics));
        }

        return dto;
    }

    /**
     * Build VM metrics for linux/windows.
     */
    private InfraDetailDTO.VmMetrics buildVmMetrics(Map<String, InfraMetrics> maxMetrics, 
                                                     Map<String, InfraMetrics> usedMetrics) {
        InfraDetailDTO.VmMetrics vmMetrics = new InfraDetailDTO.VmMetrics();
        
        vmMetrics.setCpu(buildMetricDetail("cpu_max", "cpu_used", maxMetrics, usedMetrics));
        vmMetrics.setMemory(buildMetricDetail("memory_max", "memory_used", maxMetrics, usedMetrics));
        vmMetrics.setDisk(buildMetricDetail("disk_max", "disk_used", maxMetrics, usedMetrics));
        
        return vmMetrics;
    }

    /**
     * Build ECS metrics for container infrastructure.
     */
    private InfraDetailDTO.EcsMetrics buildEcsMetrics(Map<String, InfraMetrics> maxMetrics, 
                                                       Map<String, InfraMetrics> usedMetrics) {
        InfraDetailDTO.EcsMetrics ecsMetrics = new InfraDetailDTO.EcsMetrics();
        
        ecsMetrics.setCpu(buildEcsResourceMetric("cpu", maxMetrics, usedMetrics));
        ecsMetrics.setMemory(buildEcsResourceMetric("memory", maxMetrics, usedMetrics));
        ecsMetrics.setPods(buildPodMetric(maxMetrics, usedMetrics));
        
        return ecsMetrics;
    }

    /**
     * Build generic metric detail with max and used values.
     */
    private InfraDetailDTO.MetricDetail buildMetricDetail(String maxKey, String usedKey,
                                                           Map<String, InfraMetrics> maxMetrics,
                                                           Map<String, InfraMetrics> usedMetrics) {
        InfraDetailDTO.MetricDetail detail = new InfraDetailDTO.MetricDetail();
        
        InfraMetrics maxMetric = maxMetrics.get(maxKey);
        InfraMetrics usedMetric = usedMetrics.get(usedKey);
        
        if (maxMetric != null) {
            detail.setMax(parseDouble(maxMetric.getMetricValue()));
            detail.setUnit(maxMetric.getUnit());
        }
        
        if (usedMetric != null) {
            detail.setUsed(parseDouble(usedMetric.getMetricValue()));
            if (detail.getUnit() == null) {
                detail.setUnit(usedMetric.getUnit());
            }
        }
        
        // Calculate usage percentage
        if (detail.getMax() != null && detail.getUsed() != null && detail.getMax() > 0) {
            detail.setUsagePercentage(Math.round((detail.getUsed() / detail.getMax()) * 100.0 * 10.0) / 10.0);
        }
        
        return detail;
    }

    /**
     * Build ECS resource metric with limit, request, and used values.
     */
    private InfraDetailDTO.EcsResourceMetric buildEcsResourceMetric(String resourceType,
                                                                     Map<String, InfraMetrics> maxMetrics,
                                                                     Map<String, InfraMetrics> usedMetrics) {
        InfraDetailDTO.EcsResourceMetric metric = new InfraDetailDTO.EcsResourceMetric();
        
        String limitMaxKey = "limit_" + resourceType + "_max";
        String limitUsedKey = "limit_" + resourceType + "_used";
        String requestMaxKey = "request_" + resourceType + "_max";
        
        InfraMetrics limitMaxMetric = maxMetrics.get(limitMaxKey);
        InfraMetrics limitUsedMetric = usedMetrics.get(limitUsedKey);
        InfraMetrics requestMaxMetric = maxMetrics.get(requestMaxKey);
        
        if (limitMaxMetric != null) {
            metric.setLimitMax(parseDouble(limitMaxMetric.getMetricValue()));
            metric.setUnit(limitMaxMetric.getUnit());
        }
        
        if (requestMaxMetric != null) {
            metric.setRequestMax(parseDouble(requestMaxMetric.getMetricValue()));
            if (metric.getUnit() == null) {
                metric.setUnit(requestMaxMetric.getUnit());
            }
        }
        
        // Use limit_used as the primary "used" value since it represents actual usage against the limit
        if (limitUsedMetric != null) {
            metric.setUsed(parseDouble(limitUsedMetric.getMetricValue()));
            if (metric.getUnit() == null) {
                metric.setUnit(limitUsedMetric.getUnit());
            }
        }
        
        // Calculate usage percentage based on limit
        if (metric.getLimitMax() != null && metric.getUsed() != null && metric.getLimitMax() > 0) {
            metric.setUsagePercentage(Math.round((metric.getUsed() / metric.getLimitMax()) * 100.0 * 10.0) / 10.0);
        }
        
        return metric;
    }

    /**
     * Build pod metric.
     */
    private InfraDetailDTO.PodMetric buildPodMetric(Map<String, InfraMetrics> maxMetrics,
                                                     Map<String, InfraMetrics> usedMetrics) {
        InfraDetailDTO.PodMetric metric = new InfraDetailDTO.PodMetric();
        
        InfraMetrics maxMetric = maxMetrics.get("pod_max");
        InfraMetrics usedMetric = usedMetrics.get("pod_used");
        
        if (maxMetric != null) {
            metric.setMax(parseInt(maxMetric.getMetricValue()));
        }
        
        if (usedMetric != null) {
            metric.setUsed(parseInt(usedMetric.getMetricValue()));
        }
        
        // Calculate usage percentage
        if (metric.getMax() != null && metric.getUsed() != null && metric.getMax() > 0) {
            metric.setUsagePercentage(Math.round((metric.getUsed().doubleValue() / metric.getMax().doubleValue()) * 100.0 * 10.0) / 10.0);
        }
        
        return metric;
    }

    /**
     * Parse string to double safely.
     */
    private Double parseDouble(String value) {
        try {
            return value != null ? Double.parseDouble(value) : null;
        } catch (NumberFormatException e) {
            log.warn("Failed to parse double value: {}", value);
            return null;
        }
    }

    /**
     * Parse string to integer safely.
     */
    private Integer parseInt(String value) {
        try {
            return value != null ? Integer.parseInt(value) : null;
        } catch (NumberFormatException e) {
            log.warn("Failed to parse integer value: {}", value);
            return null;
        }
    }

    private InfrastructureDTO convertToDTO(Infrastructure infra) {
        InfrastructureDTO dto = new InfrastructureDTO();
        dto.setInfraId(infra.getInfraId());
        dto.setInfraType(infra.getInfraType());
        dto.setHostname(infra.getHostname());
        dto.setIpAddress(infra.getIpAddress());
        dto.setEnvironment(infra.getEnvironment());
        dto.setRegion(infra.getRegion());
        dto.setDatacenter(infra.getDatacenter());
        dto.setStatus(infra.getStatus());

        // Add project information
        if (infra.getProject() != null) {
            dto.setProjectId(infra.getProject().getProjectId());
            dto.setProjectName(infra.getProject().getProjectName());
        }

        // Add resource limits (metrics ending with _limit)
        List<InfraMetrics> limits = infraMetricsRepository.findLimitsByInfraId(infra.getInfraId());
        dto.setResourceLimits(limits.stream()
                .map(limit -> new InfrastructureDTO.ResourceLimitDTO(
                        limit.getMetricId(),
                        limit.getMetricName().replace("_limit", ""),
                        limit.getMetricValue(),
                        limit.getUnit()
                ))
                .collect(Collectors.toList()));

        // Add current metrics (today's latest usage metrics)
        List<InfraMetrics> metrics = infraMetricsRepository.findLatestMetricsForInfra(
                infra.getInfraId(), LocalDate.now());
        dto.setCurrentMetrics(metrics.stream()
                .map(metric -> new InfrastructureDTO.UsageMetricDTO(
                        metric.getMetricId(),
                        metric.getMetricName(),
                        metric.getMetricValue(),
                        metric.getUnit(),
                        metric.getMetricTime() != null ?
                            metric.getMetricTime().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null
                ))
                .collect(Collectors.toList()));

        return dto;
    }
}
