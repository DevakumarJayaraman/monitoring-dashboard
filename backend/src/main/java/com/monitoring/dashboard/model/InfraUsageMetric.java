package com.monitoring.dashboard.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "ops_infra_usage_metrics")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InfraUsageMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "metric_id")
    private Long metricId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "infra_id", nullable = false)
    @JsonIgnore
    private Infrastructure infrastructure;

    @Column(name = "metric_name", nullable = false)
    private String metricName;  // cpu_usage_pct, disk_usage_pct

    @Column(name = "metric_value", nullable = false)
    private String metricValue;

    @Column(name = "unit")
    private String unit;

    @Column(name = "metric_date", nullable = false)
    private LocalDate metricDate;  // summary date

    @Column(name = "metric_time", nullable = false)
    private LocalDateTime metricTime;  // exact timestamp

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;
}
