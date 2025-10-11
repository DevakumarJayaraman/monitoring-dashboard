package com.monitoring.dashboard.repository;

import com.monitoring.dashboard.model.Region;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RegionRepository extends JpaRepository<Region, Integer> {
    Optional<Region> findByRegionCode(String regionCode);
}
