package com.monitoring.dashboard.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ops_deployment_configs",
       uniqueConstraints = @UniqueConstraint(
           name = "uk_deployment_config_component_infra",
           columnNames = {"componentId", "infraId"}
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
    @JoinColumn(name = "infraId", nullable = false)
    @JsonIgnore
    private Infrastructure infrastructure;

    @Column(name = "basePort")
    private Integer basePort; // Starting port number for instances

    @Lob
    @Column(name = "deployParams", columnDefinition = "BLOB")
    private byte[] deployParams; // JSON blob storing deployment parameters including:
                                  // For ECS: minPods, maxPods, cpuRequest, cpuLimit, memoryRequest, memoryLimit
                                  // For VM: instanceCount, heapSize, threads, etc.

    @Column(name = "enabled", nullable = false)
    private Boolean enabled = true;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "profile_id")
    private ProjectProfiles profile;

    @OneToMany(mappedBy = "deploymentConfig", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ServiceInstance> serviceInstances = new ArrayList<>();
}
