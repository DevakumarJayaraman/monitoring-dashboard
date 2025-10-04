package com.monitoring.dashboard.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ops_infra")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Infrastructure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "infra_id")
    private Long infraId;

    @Column(name = "infra_name", nullable = false)
    private String infraName;

    @Column(name = "infra_type", nullable = false)
    private String infraType;  // ecs/linux/windows/dbaas

    @Column(name = "hostname")
    private String hostname;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "environment")
    private String environment;  // DEV/UAT/PROD

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @OneToMany(mappedBy = "infrastructure", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InfraResourceLimit> resourceLimits = new ArrayList<>();

    @OneToMany(mappedBy = "infrastructure", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InfraUsageMetric> usageMetrics = new ArrayList<>();

    @OneToMany(mappedBy = "infrastructure", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ServiceDeployment> serviceDeployments = new ArrayList<>();
}
