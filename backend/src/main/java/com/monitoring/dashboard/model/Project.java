package com.monitoring.dashboard.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing an operational project.
 * A project can have multiple environments (DEV, UAT, PROD, etc.) across different regions.
 */
@Entity
@Table(name = "ops_projects")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Project {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "projectId")
    private Long projectId;

    @Column(name = "projectName", nullable = false, length = 255)
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

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Infrastructure> infrastructures = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Component> components = new ArrayList<>();

    public Project(String projectName, String description) {
        this.projectName = projectName;
        this.description = description;
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

    public void addInfrastructure(Infrastructure infrastructure) {
        infrastructures.add(infrastructure);
        infrastructure.setProject(this);
    }

    public void removeInfrastructure(Infrastructure infrastructure) {
        infrastructures.remove(infrastructure);
        infrastructure.setProject(null);
    }

    public void addComponent(Component component) {
        components.add(component);
        component.setProject(this);
    }

    public void removeComponent(Component component) {
        components.remove(component);
        component.setProject(null);
    }
}
