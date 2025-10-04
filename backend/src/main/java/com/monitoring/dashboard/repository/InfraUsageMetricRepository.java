package com.monitoring.dashboard.repository;

import com.monitoring.dashboard.model.InfraUsageMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface InfraUsageMetricRepository extends JpaRepository<InfraUsageMetric, Long> {

    List<InfraUsageMetric> findByInfrastructure_InfraId(Long infraId);

    List<InfraUsageMetric> findByMetricName(String metricName);

    List<InfraUsageMetric> findByMetricDate(LocalDate metricDate);

    @Query("SELECT m FROM InfraUsageMetric m WHERE m.infrastructure.infraId = :infraId AND m.metricDate = :date ORDER BY m.metricTime DESC")
    List<InfraUsageMetric> findLatestMetricsForInfra(
        @Param("infraId") Long infraId,
        @Param("date") LocalDate date
    );
}
