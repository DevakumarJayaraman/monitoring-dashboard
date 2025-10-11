package com.monitoring.dashboard.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing an operational project.
 * A project can operate across multiple environment/region combinations and hosts infrastructure/components.
 */
@Entity
@Table(name = "ops_projects")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "project_name", nullable = false, length = 255)
    private String projectName;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "active_flag")
    private Boolean activeFlag = Boolean.TRUE;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<ProjectEnvironmentMapping> environmentMappings = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Component> components = new ArrayList<>();

    public Project(String projectName, String description) {
        this.projectName = projectName;
        this.description = description;
    }

    @PrePersist
    private void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (activeFlag == null) {
            activeFlag = Boolean.TRUE;
        }
    }

    public void addEnvironmentMapping(ProjectEnvironmentMapping mapping) {
        environmentMappings.add(mapping);
        mapping.setProject(this);
    }

    public void removeEnvironmentMapping(ProjectEnvironmentMapping mapping) {
        environmentMappings.remove(mapping);
        mapping.setProject(null);
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
