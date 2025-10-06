package com.monitoring.dashboard.repository;

import com.monitoring.dashboard.model.InfraMetrics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface InfraMetricsRepository extends JpaRepository<InfraMetrics, Long> {

    List<InfraMetrics> findByInfrastructure_InfraId(Long infraId);

    @Query("SELECT im FROM InfraMetrics im WHERE im.infrastructure.infraId = :infraId AND im.metricName LIKE '%_limit'")
    List<InfraMetrics> findLimitsByInfraId(@Param("infraId") Long infraId);

    @Query("SELECT im FROM InfraMetrics im WHERE im.infrastructure.infraId = :infraId AND im.metricName LIKE '%_usage%'")
    List<InfraMetrics> findUsageMetricsByInfraId(@Param("infraId") Long infraId);

    @Query("SELECT im FROM InfraMetrics im WHERE im.infrastructure.infraId = :infraId AND im.metricDate = :date AND im.metricName LIKE '%_usage%'")
    List<InfraMetrics> findLatestMetricsForInfra(@Param("infraId") Long infraId, @Param("date") LocalDate date);
}

