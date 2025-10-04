package com.monitoring.dashboard.repository;

import com.monitoring.dashboard.model.InfraResourceLimit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InfraResourceLimitRepository extends JpaRepository<InfraResourceLimit, Long> {

    List<InfraResourceLimit> findByInfrastructure_InfraId(Long infraId);

    List<InfraResourceLimit> findByResourceName(String resourceName);
}
