package com.monitoring.dashboard.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "ops_infra_metrics")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InfraMetrics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "metricId")
    private Long metricId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "infraId", nullable = false)
    @JsonIgnore
    private Infrastructure infrastructure;

    @Column(name = "metricName", nullable = false)
    private String metricName;  // cpu_limit, memory_limit, cpu_usage, memory_usage, etc.

    @Column(name = "metricValue", nullable = false)
    private String metricValue;

    @Column(name = "unit")
    private String unit;

    @Column(name = "metricDate")
    private LocalDate metricDate;  // summary date (null for limits)

    @Column(name = "metricTime")
    private LocalDateTime metricTime;  // exact timestamp (null for limits)

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;
}
