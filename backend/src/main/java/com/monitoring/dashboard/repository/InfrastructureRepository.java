package com.monitoring.dashboard.repository;

import com.monitoring.dashboard.model.Infrastructure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InfrastructureRepository extends JpaRepository<Infrastructure, Long> {

    Optional<Infrastructure> findByInfraName(String infraName);

    List<Infrastructure> findByInfraType(String infraType);

    List<Infrastructure> findByEnvironment(String environment);

    List<Infrastructure> findByInfraTypeAndEnvironment(String infraType, String environment);

    @Query("SELECT i FROM Infrastructure i WHERE i.infraType = :infraType AND i.environment = :environment")
    List<Infrastructure> findByTypeAndEnvironment(
        @Param("infraType") String infraType,
        @Param("environment") String environment
    );

    boolean existsByInfraName(String infraName);
}
