package com.monitoring.dashboard.repository;

import com.monitoring.dashboard.model.ServiceInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for ServiceInstance entities.
 */
@Repository
public interface ServiceInstanceRepository extends JpaRepository<ServiceInstance, String> {
    
    /**
     * Find all service instances by service name.
     */
    List<ServiceInstance> findByServiceName(String serviceName);
    
    /**
     * Find all service instances by profile.
     */
    List<ServiceInstance> findByProfile(String profile);
    
    /**
     * Find all service instances by machine name.
     */
    List<ServiceInstance> findByMachineName(String machineName);
    
    /**
     * Find all service instances by infra type.
     */
    List<ServiceInstance> findByInfraType(String infraType);
    
    /**
     * Find all service instances by status.
     */
    List<ServiceInstance> findByStatus(String status);
    
    /**
     * Find all service instances by profile and service name.
     */
    List<ServiceInstance> findByProfileAndServiceName(String profile, String serviceName);
    
    /**
     * Find all service instances by deployment config ID.
     */
    List<ServiceInstance> findByDeploymentConfig_ConfigId(Long configId);

    /**
     * Find all service instances by component's project ID (via deploymentConfig).
     */
    List<ServiceInstance> findByDeploymentConfig_Component_Project_ProjectId(Long projectId);

    /**
     * Get all components with their deployment configs, infrastructure, and service instances for a project.
     * This query uses LEFT JOINs starting from Component to include ALL components,
     * even those without deployment configs or service instances.
     * Returns data that can be used to generate service instance DTOs.
     */
    @Query("""
        SELECT c.componentId, c.componentName, c.description, c.module,
               dc.configId, dc.basePort, dc.enabled,
               i.infraId, i.hostname, i.infraType, i.environment, i.region,
               p.profileCode,
               si.instanceId, si.serviceName, si.machineName, si.port, si.profile,
               si.version, si.uptimeSeconds, si.status, si.deployedAt, si.lastUpdated
        FROM Component c
        LEFT JOIN c.deploymentConfigs dc
        LEFT JOIN dc.infrastructure i
        LEFT JOIN dc.profile p
        LEFT JOIN dc.serviceInstances si
        WHERE c.project.projectId = :projectId
        ORDER BY c.componentName, i.hostname
    """)
    List<Object[]> findDeploymentDataByProjectId(@Param("projectId") Long projectId);

    /**
     * Get all components with their deployment configs, infrastructure, and service instances (all projects).
     * This query uses LEFT JOINs starting from Component to include ALL components,
     * even those without deployment configs or service instances.
     */
    @Query("""
        SELECT c.componentId, c.componentName, c.description, c.module,
               dc.configId, dc.basePort, dc.enabled,
               i.infraId, i.hostname, i.infraType, i.environment, i.region,
               p.profileCode,
               si.instanceId, si.serviceName, si.machineName, si.port, si.profile,
               si.version, si.uptimeSeconds, si.status, si.deployedAt, si.lastUpdated
        FROM Component c
        LEFT JOIN c.deploymentConfigs dc
        LEFT JOIN dc.infrastructure i
        LEFT JOIN dc.profile p
        LEFT JOIN dc.serviceInstances si
        ORDER BY c.componentName, i.hostname
    """)
    List<Object[]> findAllDeploymentData();
}
