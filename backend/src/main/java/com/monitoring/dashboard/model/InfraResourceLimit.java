package com.monitoring.dashboard.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "infra_resource_limits")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InfraResourceLimit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "limit_id")
    private Long limitId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "infra_id", nullable = false)
    @JsonIgnore
    private Infrastructure infrastructure;

    @Column(name = "resource_name", nullable = false)
    private String resourceName;  // cpu, memory, disk

    @Column(name = "limit_value", nullable = false)
    private String limitValue;

    @Column(name = "unit")
    private String unit;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;
}
