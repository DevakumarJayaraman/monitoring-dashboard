package com.monitoring.dashboard.repository;

import com.monitoring.dashboard.model.ServiceDeployment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceDeploymentRepository extends JpaRepository<ServiceDeployment, Long> {

    List<ServiceDeployment> findByInfrastructure_InfraId(Long infraId);

    List<ServiceDeployment> findByService_ServiceId(Long serviceId);

    List<ServiceDeployment> findByProfile(String profile);

    @Query("SELECT sd FROM ServiceDeployment sd WHERE sd.service.serviceId = :serviceId AND sd.infrastructure.infraId = :infraId AND sd.profile = :profile")
    Optional<ServiceDeployment> findByServiceAndInfraAndProfile(
        @Param("serviceId") Long serviceId,
        @Param("infraId") Long infraId,
        @Param("profile") String profile
    );
}
