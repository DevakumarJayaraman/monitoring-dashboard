package com.monitoring.dashboard.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Master entity representing an environment tier (DEV, STAGING, PROD, COB).
 */
@Entity
@Table(name = "ops_environments",
       uniqueConstraints = @UniqueConstraint(name = "uk_ops_environments_code", columnNames = "env_code"))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Environment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "env_id")
    private Integer envId;

    @Column(name = "env_code", nullable = false, length = 20)
    private String envCode;

    @Column(name = "env_desc", length = 100)
    private String envDesc;

    @OneToMany(mappedBy = "environment", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<ProjectEnvironmentMapping> projectMappings = new ArrayList<>();

    public Environment(String envCode, String envDesc) {
        this.envCode = envCode;
        this.envDesc = envDesc;
    }
}
