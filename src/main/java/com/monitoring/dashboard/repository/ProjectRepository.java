package com.monitoring.dashboard.repository;

import com.monitoring.dashboard.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for Project entity operations.
 * Provides CRUD operations and custom query methods for projects.
 */
@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    /**
     * Find a project by its name.
     * @param projectName the name of the project
     * @return Optional containing the project if found
     */
    Optional<Project> findByProjectName(String projectName);

    /**
     * Check if a project exists with the given name.
     * @param projectName the name to check
     * @return true if a project with this name exists
     */
    boolean existsByProjectName(String projectName);
}
