package com.monitoring.dashboard.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

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
               columnNames = {"projectId", "envCode", "regionCode", "profileCode"}
           )
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectEnvironment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "envId")
    private Long envId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projectId", nullable = false)
    private Project project;

    @Column(name = "envCode", nullable = false, length = 50)
    private String envCode;  // DEV, UAT, STAGING, PROD

    @Column(name = "regionCode", length = 50)
    private String regionCode;  // APAC, EMEA, NAM (optional)

    @Column(name = "profileCode", length = 100)
    private String profileCode;  // apacuat, prod-blue, dailyrefresh, etc.

    @Column(name = "description", length = 255)
    private String description;

    /**
     * Version field for JPA optimistic locking. Incremented automatically on update.
     */
    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @OneToMany(mappedBy = "projectEnvironment", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Infrastructure> infrastructures = new ArrayList<>();

    public ProjectEnvironment(String envCode, String regionCode, String profileCode, String description) {
        this.envCode = envCode;
        this.regionCode = regionCode;
        this.profileCode = profileCode;
        this.description = description;
    }
}
