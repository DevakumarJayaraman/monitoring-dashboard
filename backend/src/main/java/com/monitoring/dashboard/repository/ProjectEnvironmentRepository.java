package com.monitoring.dashboard.repository;

import com.monitoring.dashboard.model.ProjectEnvironment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for ProjectEnvironment entity operations.
 * Provides CRUD operations and custom query methods for project environments.
 */
@Repository
public interface ProjectEnvironmentRepository extends JpaRepository<ProjectEnvironment, Long> {

    /**
     * Find all environments for a specific project.
     * @param projectId the project ID
     * @return list of project environments
     */
    @Query("SELECT pe FROM ProjectEnvironment pe WHERE pe.project.projectId = :projectId")
    List<ProjectEnvironment> findByProjectId(@Param("projectId") Long projectId);

    /**
     * Find environments by environment code (e.g., DEV, UAT, PROD).
     * @param envCode the environment code
     * @return list of matching environments
     */
    List<ProjectEnvironment> findByEnvCode(String envCode);

    /**
     * Find environments by region code (e.g., APAC, EMEA, NAM).
     * @param regionCode the region code
     * @return list of matching environments
     */
    List<ProjectEnvironment> findByRegionCode(String regionCode);

    /**
     * Find environments by profile code.
     * @param profileCode the profile code
     * @return list of matching environments
     */
    List<ProjectEnvironment> findByProfileCode(String profileCode);

    /**
     * Find a specific environment by project ID, env code, region code, and profile code.
     * @param projectId the project ID
     * @param envCode the environment code
     * @param regionCode the region code
     * @param profileCode the profile code
     * @return Optional containing the environment if found
     */
    @Query("SELECT pe FROM ProjectEnvironment pe WHERE pe.project.projectId = :projectId " +
           "AND pe.envCode = :envCode " +
           "AND (pe.regionCode = :regionCode OR (pe.regionCode IS NULL AND :regionCode IS NULL)) " +
           "AND (pe.profileCode = :profileCode OR (pe.profileCode IS NULL AND :profileCode IS NULL))")
    Optional<ProjectEnvironment> findByProjectAndCodes(@Param("projectId") Long projectId,
                                                        @Param("envCode") String envCode,
                                                        @Param("regionCode") String regionCode,
                                                        @Param("profileCode") String profileCode);

    /**
     * Find environments by project ID and environment code.
     * @param projectId the project ID
     * @param envCode the environment code
     * @return list of matching environments
     */
    @Query("SELECT pe FROM ProjectEnvironment pe WHERE pe.project.projectId = :projectId AND pe.envCode = :envCode")
    List<ProjectEnvironment> findByProjectIdAndEnvCode(@Param("projectId") Long projectId,
                                                        @Param("envCode") String envCode);
}
