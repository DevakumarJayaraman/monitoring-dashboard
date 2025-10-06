package com.monitoring.dashboard.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity representing a service instance deployed on infrastructure.
 * Each instance is a running deployment of a microservice on a specific machine/container.
 */
@Entity
@Table(name = "ops_service_instances")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceInstance {
    
    @Id
    @Column(name = "instanceId", length = 50)
    private String instanceId;

    @Column(name = "serviceName", nullable = false, length = 100)
    private String serviceName;

    @Column(name = "machineName", nullable = false, length = 100)
    private String machineName;

    @Column(name = "infraType", nullable = false, length = 20)
    private String infraType; // linux, windows, ecs

    @Column(name = "profile", nullable = false, length = 50)
    private String profile; // apacqa, apacuat, emeaqa, etc.

    @Column(name = "version", length = 20)
    private String version;

    @Column(name = "port")
    private Integer port;

    @Column(name = "uptimeSeconds")
    private Integer uptimeSeconds;

    @Column(name = "status", length = 20)
    private String status; // running, degraded, restarting

    @Column(name = "logUrl", length = 500)
    private String logUrl;

    @Column(name = "metricsUrl", length = 500)
    private String metricsUrl;

    /**
     * Version field for JPA optimistic locking.
     */
    @Version
    @Column(name = "versionLock", nullable = false)
    private Long versionLock = 0L;
}
