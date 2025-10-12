package com.monitoring.dashboard.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Association entity linking a project to a specific environment tier and region.
 */
@Entity
@Table(name = "ops_project_env_region",
       uniqueConstraints = @UniqueConstraint(name = "uq_per_unique", columnNames = {"project_id", "env_id", "region_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectEnvironmentMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "per_id")
    private Long perId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @JsonBackReference
    private Project project;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "env_id", nullable = false)
    @JsonBackReference
    private Environment environment;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "region_id", nullable = false)
    @JsonBackReference
    private Region region;

    @Column(name = "active_flag")
    private Boolean activeFlag = Boolean.TRUE;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "projectEnvironmentMapping", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<ProjectProfiles> profiles = new ArrayList<>();

    @OneToMany(mappedBy = "projectEnvironmentMapping", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Infrastructure> infrastructures = new ArrayList<>();

    @PrePersist
    private void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (activeFlag == null) {
            activeFlag = Boolean.TRUE;
        }
    }

    public void addProfile(ProjectProfiles profile) {
        profiles.add(profile);
        profile.setProjectEnvironmentMapping(this);
    }

    public void removeProfile(ProjectProfiles profile) {
        profiles.remove(profile);
        profile.setProjectEnvironmentMapping(null);
    }
}
