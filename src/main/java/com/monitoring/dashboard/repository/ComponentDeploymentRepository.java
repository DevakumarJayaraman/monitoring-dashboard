// ...contents from ServiceDeploymentRepository.java, now as ComponentDeploymentRepository.java...
package com.monitoring.dashboard.repository;

import com.monitoring.dashboard.model.ComponentDeployment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComponentDeploymentRepository extends JpaRepository<ComponentDeployment, Long> {
    List<ComponentDeployment> findByInfrastructure_InfraId(Long infraId);
    List<ComponentDeployment> findByComponent_ComponentId(Long componentId);
    List<ComponentDeployment> findByComponent_Project_ProjectId(Long projectId);
    List<ComponentDeployment> findByProfile(String profile);
    @Query("SELECT cd FROM ComponentDeployment cd WHERE cd.component.componentId = :componentId AND cd.infrastructure.infraId = :infraId AND cd.profile = :profile")
    Optional<ComponentDeployment> findByComponentAndInfraAndProfile(
        @Param("componentId") Long componentId,
        @Param("infraId") Long infraId,
        @Param("profile") String profile
    );
}
