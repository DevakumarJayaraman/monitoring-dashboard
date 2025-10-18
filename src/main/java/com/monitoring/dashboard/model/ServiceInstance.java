package com.monitoring.dashboard.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity representing a service instance deployed on infrastructure.
 * Each instance is a running deployment of a microservice on a specific machine/container.
 * Entries are created based on ops_deployment_configs, and runtime data (status, uptime, version)
 * is populated later by runtime agents.
 */
@Entity
@Table(name = "ops_service_instances")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceInstance {
    
    @Id
    @Column(name = "instanceId", length = 150)
    private String instanceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "configId",
        nullable = false,
        foreignKey = @ForeignKey(name = "fk_service_instance_deployment_config")
    )
    @JsonIgnore
    private DeploymentConfig deploymentConfig;

    @Column(name = "serviceName", nullable = false, length = 100)
    private String serviceName;

    @Column(name = "machineName", nullable = false, length = 100)
    private String machineName;

    @Column(name = "infraType", nullable = false, length = 20)
    private String infraType; // linux, windows, ecs

    @Column(name = "profile", nullable = false, length = 50)
    private String profile; // apacqa, apacuat, emeaqa, etc.

    @Column(name = "port")
    private Integer port;

    // Runtime data populated by agents
    @Column(name = "version", length = 20)
    private String version;

    @Column(name = "uptimeSeconds")
    private Integer uptimeSeconds;

    @Column(name = "status", length = 20)
    private String status; // running, degraded, restarting, starting, stopping, stopped

    @Column(name = "deployedAt")
    private LocalDateTime deployedAt;

    @Column(name = "lastUpdated")
    private LocalDateTime lastUpdated;

    /**
     * Version field for JPA optimistic locking.
     */
    @Version
    @Column(name = "versionLock", nullable = false)
    private Long versionLock = 0L;
}
