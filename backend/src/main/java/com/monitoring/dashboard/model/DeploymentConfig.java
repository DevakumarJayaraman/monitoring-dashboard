package com.monitoring.dashboard.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ops_deployment_configs",
       uniqueConstraints = @UniqueConstraint(
           name = "uk_service_infra_profile_resource",
           columnNames = {"service_id", "infra_id", "profile", "resource_name"}
       ))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeploymentConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "config_id")
    private Long configId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    @JsonIgnore
    private Service service;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "infra_id")
    @JsonIgnore
    private Infrastructure infrastructure;

    @Column(name = "profile")
    private String profile;

    @Column(name = "resource_name", nullable = false)
    private String resourceName;  // cpu, memory, threads

    @Column(name = "limit_value", nullable = false)
    private String limitValue;

    @Column(name = "unit")
    private String unit;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;
}
