package com.monitoring.dashboard.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ops_component_deployments",
       uniqueConstraints = @UniqueConstraint(
           name = "uk_component_infra_profile",
           columnNames = {"componentId", "infraId", "profile"}
       ))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComponentDeployment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mappingId")
    private Long mappingId;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "componentId", nullable = false)
    @JsonIgnore
    private Component component;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "infraId", nullable = false)
    @JsonIgnore
    private Infrastructure infrastructure;
    @Column(name = "profile", nullable = false)
    private String profile;
    @Column(name = "instanceId", unique = true, length = 50)
    private String instanceId;
    @Column(name = "port")
    private Integer port;
    @Column(name = "componentVersion", length = 20)
    private String componentVersion;
    @Column(name = "status", length = 20)
    private String status;
    @Column(name = "uptimeSeconds")
    private Long uptimeSeconds;
}
