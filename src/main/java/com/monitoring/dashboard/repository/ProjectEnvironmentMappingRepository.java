package com.monitoring.dashboard.repository;

import com.monitoring.dashboard.model.ProjectEnvironmentMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjectEnvironmentMappingRepository extends JpaRepository<ProjectEnvironmentMapping, Long> {
    Optional<ProjectEnvironmentMapping> findByProjectProjectIdAndEnvironmentEnvCodeAndRegionRegionCode(Long projectId, String envCode, String regionCode);
}
