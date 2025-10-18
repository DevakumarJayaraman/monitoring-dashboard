package com.monitoring.dashboard.repository;

import com.monitoring.dashboard.model.DeploymentConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeploymentConfigRepository extends JpaRepository<DeploymentConfig, Long> {

    List<DeploymentConfig> findByComponent_ComponentId(Long componentId);

    List<DeploymentConfig> findByInfrastructure_InfraId(Long infraId);

    // Find all deployment configs for components belonging to a project
    List<DeploymentConfig> findByComponent_Project_ProjectId(Long projectId);
}
