package com.monitoring.dashboard.repository;

import com.monitoring.dashboard.model.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRepository extends JpaRepository<Service, Long> {

    Optional<Service> findByServiceName(String serviceName);

    List<Service> findByOwningTeam(String owningTeam);

    boolean existsByServiceName(String serviceName);
}
