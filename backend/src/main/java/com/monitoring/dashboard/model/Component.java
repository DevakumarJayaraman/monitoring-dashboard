package com.monitoring.dashboard.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ops_components")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Component {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "componentId")
    private Long componentId;
    @Column(name = "componentName", nullable = false)
    private String componentName;
    @Column(name = "description", length = 2048)
    private String description;
    @Column(name = "module", length = 100)
    private String module;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "projectId")
    @JsonIgnore
    private Project project;
    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;
    @OneToMany(mappedBy = "component", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ComponentDeployment> deployments = new ArrayList<>();
    @OneToMany(mappedBy = "component", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DeploymentConfig> deploymentConfigs = new ArrayList<>();
}
