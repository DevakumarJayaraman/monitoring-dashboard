package com.monitoring.dashboard.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing an operational project.
 * A project can have multiple environments (DEV, UAT, PROD, etc.) across different regions.
 */
@Entity
@Table(name = "ops_projects")
public class Project {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "project_name", nullable = false, length = 255)
    private String projectName;

    @Column(name = "description", length = 1000)
    private String description;

    /**
     * Version field for JPA optimistic locking. Incremented automatically on update.
     */
    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProjectEnvironment> environments = new ArrayList<>();

    public Project() {
        // Default constructor required by JPA
    }

    public Project(String projectName, String description) {
        this.projectName = projectName;
        this.description = description;
    }

    // Getters and setters

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public String getProjectName() {
        return projectName;
    }

    public void setProjectName(String projectName) {
        this.projectName = projectName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public List<ProjectEnvironment> getEnvironments() {
        return environments;
    }

    public void setEnvironments(List<ProjectEnvironment> environments) {
        this.environments = environments;
    }

    // Helper methods for bidirectional relationship

    public void addEnvironment(ProjectEnvironment environment) {
        environments.add(environment);
        environment.setProject(this);
    }

    public void removeEnvironment(ProjectEnvironment environment) {
        environments.remove(environment);
        environment.setProject(null);
    }

    @Override
    public String toString() {
        return "Project{" +
                "projectId=" + projectId +
                ", projectName='" + projectName + '\'' +
                ", description='" + description + '\'' +
                ", version=" + version +
                '}';
    }
}
