package com.monitoring.dashboard.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ops_deployment_configs",
       uniqueConstraints = @UniqueConstraint(
           name = "uk_component_infra_profile_resource",
           columnNames = {"componentId", "infraId", "profile", "resourceName"}
       ))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeploymentConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "configId")
    private Long configId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "componentId", nullable = false)
    @JsonIgnore
    private Component component;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "infraId")
    @JsonIgnore
    private Infrastructure infrastructure;

    @Column(name = "profile")
    private String profile;

    @Column(name = "resourceName", nullable = false)
    private String resourceName;  // cpu, memory, threads

    @Column(name = "limitValue", nullable = false)
    private String limitValue;

    @Column(name = "unit")
    private String unit;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;
}
