package com.monitoring.dashboard.repository;

import com.monitoring.dashboard.model.ProjectProfiles;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for ProjectProfiles (profile) entity operations.
 */
@Repository
public interface ProjectEnvironmentRepository extends JpaRepository<ProjectProfiles, Long> {

    List<ProjectProfiles> findByProjectEnvironmentMappingProjectProjectId(Long projectId);

    List<ProjectProfiles> findByProjectEnvironmentMappingEnvironmentEnvCode(String envCode);

    List<ProjectProfiles> findByProjectEnvironmentMappingRegionRegionCode(String regionCode);

    List<ProjectProfiles> findByProfileCode(String profileCode);

    Optional<ProjectProfiles> findByProjectEnvironmentMappingProjectProjectIdAndProjectEnvironmentMappingEnvironmentEnvCodeAndProjectEnvironmentMappingRegionRegionCodeAndProfileCode(
            Long projectId,
            String envCode,
            String regionCode,
            String profileCode);

    List<ProjectProfiles> findByProjectEnvironmentMappingProjectProjectIdAndProjectEnvironmentMappingEnvironmentEnvCode(
            Long projectId,
            String envCode);
}
