package com.monitoring.dashboard.repository;

import com.monitoring.dashboard.model.ServiceInstance;
import org.springframework.data.jpa.repository.JpaRepository;
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
     * Find all service instances by component's project ID.
     */
    List<ServiceInstance> findByComponent_Project_ProjectId(Long projectId);
}
