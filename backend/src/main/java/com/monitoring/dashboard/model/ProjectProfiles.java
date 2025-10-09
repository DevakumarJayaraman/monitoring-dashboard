package com.monitoring.dashboard.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Represents a deployable profile (e.g., apacqa, emeaprod) tied to a project/environment/region mapping.
 */
@Entity
@Table(name = "ops_profiles",
       uniqueConstraints = @UniqueConstraint(name = "uq_profile_code", columnNames = {"per_id", "profile_code"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectProfiles {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "profile_id")
    private Long profileId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "per_id", nullable = false)
    private ProjectEnvironmentMapping projectEnvironmentMapping;

    @Column(name = "profile_code", nullable = false, length = 50)
    private String profileCode;

    @Column(name = "profile_desc", length = 200)
    private String profileDesc;

    @Column(name = "status", length = 20)
    private String status = "ACTIVE";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @PrePersist
    private void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "ACTIVE";
        }
    }

    // Convenience getters to expose mapping data
    @JsonIgnore
    public Project getProject() {
        return projectEnvironmentMapping != null ? projectEnvironmentMapping.getProject() : null;
    }

    @JsonIgnore
    public Environment getEnvironment() {
        return projectEnvironmentMapping != null ? projectEnvironmentMapping.getEnvironment() : null;
    }

    @JsonIgnore
    public Region getRegion() {
        return projectEnvironmentMapping != null ? projectEnvironmentMapping.getRegion() : null;
    }

    public String getEnvCode() {
        Environment environment = getEnvironment();
        return environment != null ? environment.getEnvCode() : null;
    }

    public String getRegionCode() {
        Region region = getRegion();
        return region != null ? region.getRegionCode() : null;
    }

    public Long getProjectId() {
        Project project = getProject();
        return project != null ? project.getProjectId() : null;
    }

    public String getProjectName() {
        Project project = getProject();
        return project != null ? project.getProjectName() : null;
    }
}
