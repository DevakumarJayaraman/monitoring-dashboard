package com.monitoring.dashboard.repository;

import com.monitoring.dashboard.model.Environment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EnvironmentRepository extends JpaRepository<Environment, Integer> {
    Optional<Environment> findByEnvCode(String envCode);
}
