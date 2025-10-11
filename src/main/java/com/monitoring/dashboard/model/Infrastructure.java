package com.monitoring.dashboard.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
    @Column(name = "infraId")
    private Long infraId;

    @Column(name = "infraType", nullable = false)
    private String infraType;  // ecs/linux/windows/dbaas

    @Column(name = "hostname", nullable = false)
    private String hostname;

    @Column(name = "ipAddress")
    private String ipAddress;

    @Column(name = "environment")
    private String environment;  // DEV/UAT/PROD

    @Column(name = "region", length = 20)
    private String region;  // APAC, NAM, EMEA

    @Column(name = "datacenter", length = 50)
    private String datacenter;  // ap-southeast-1a, us-east-1a, etc.

    @Column(name = "status", length = 20)
    private String status;  // healthy, watch, scaling

    @Column(name = "infraName")
    private String infraName; // short name, e.g. "apacqa-vm1"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "per_id")
    @JsonIgnore
    private ProjectEnvironmentMapping projectEnvironmentMapping;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @OneToMany(mappedBy = "infrastructure", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InfraMetrics> metrics = new ArrayList<>();

    @OneToMany(mappedBy = "infrastructure", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ComponentDeployment> componentDeployments = new ArrayList<>();
}
