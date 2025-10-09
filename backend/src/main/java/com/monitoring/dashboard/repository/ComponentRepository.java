package com.monitoring.dashboard.repository;

import com.monitoring.dashboard.model.Component;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComponentRepository extends JpaRepository<Component, Long> {
    Optional<Component> findByComponentName(String componentName);
    List<Component> findByModule(String module);
    boolean existsByComponentName(String componentName);
    List<Component> findByProject_ProjectId(Long projectId);
}
