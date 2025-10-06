package com.monitoring.dashboard.repository;

import com.monitoring.dashboard.model.DeploymentConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeploymentConfigRepository extends JpaRepository<DeploymentConfig, Long> {

    List<DeploymentConfig> findByComponent_ComponentId(Long componentId);

    List<DeploymentConfig> findByInfrastructure_InfraId(Long infraId);

    List<DeploymentConfig> findByProfile(String profile);

    @Query("SELECT dc FROM DeploymentConfig dc WHERE dc.component.componentId = :componentId AND dc.infrastructure.infraId = :infraId AND dc.profile = :profile")
    List<DeploymentConfig> findByComponentAndInfraAndProfile(
        @Param("componentId") Long componentId,
        @Param("infraId") Long infraId,
        @Param("profile") String profile
    );
}
