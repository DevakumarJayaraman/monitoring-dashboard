package com.monitoring.dashboard.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ops_service_deployments", 
       uniqueConstraints = @UniqueConstraint(
           name = "uk_service_infra_profile",
           columnNames = {"service_id", "infra_id", "profile"}
       ))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceDeployment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mapping_id")
    private Long mappingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    @JsonIgnore
    private Service service;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "infra_id", nullable = false)
    @JsonIgnore
    private Infrastructure infrastructure;

    @Column(name = "profile", nullable = false)
    private String profile;

    @Column(name = "port")
    private Integer port;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;
}
