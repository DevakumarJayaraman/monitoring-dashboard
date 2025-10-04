package com.monitoring.dashboard.model;

import jakarta.persistence.*;

/**
 * Entity representing a project environment.
 * Each environment belongs to a project and can have multiple attributes like
 * environment code (DEV, UAT, PROD), region code (APAC, EMEA, NAM), and profile code.
 */
@Entity
@Table(name = "ops_project_environments",
       uniqueConstraints = {
           @UniqueConstraint(
               name = "uk_project_env_region_profile",
               columnNames = {"project_id", "env_code", "region_code", "profile_code"}
           )
       })
public class ProjectEnvironment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "env_id")
    private Long envId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "env_code", nullable = false, length = 50)
    private String envCode;  // DEV, UAT, STAGING, PROD

    @Column(name = "region_code", length = 50)
    private String regionCode;  // APAC, EMEA, NAM (optional)

    @Column(name = "profile_code", length = 100)
    private String profileCode;  // apacuat, prod-blue, dailyrefresh, etc.

    @Column(name = "description", length = 255)
    private String description;

    /**
     * Version field for JPA optimistic locking. Incremented automatically on update.
     */
    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    public ProjectEnvironment() {
        // Default constructor required by JPA
    }

    public ProjectEnvironment(String envCode, String regionCode, String profileCode, String description) {
        this.envCode = envCode;
        this.regionCode = regionCode;
        this.profileCode = profileCode;
        this.description = description;
    }

    // Getters and setters

    public Long getEnvId() {
        return envId;
    }

    public void setEnvId(Long envId) {
        this.envId = envId;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public String getEnvCode() {
        return envCode;
    }

    public void setEnvCode(String envCode) {
        this.envCode = envCode;
    }

    public String getRegionCode() {
        return regionCode;
    }

    public void setRegionCode(String regionCode) {
        this.regionCode = regionCode;
    }

    public String getProfileCode() {
        return profileCode;
    }

    public void setProfileCode(String profileCode) {
        this.profileCode = profileCode;
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

    @Override
    public String toString() {
        return "ProjectEnvironment{" +
                "envId=" + envId +
                ", envCode='" + envCode + '\'' +
                ", regionCode='" + regionCode + '\'' +
                ", profileCode='" + profileCode + '\'' +
                ", description='" + description + '\'' +
                ", version=" + version +
                '}';
    }
}
