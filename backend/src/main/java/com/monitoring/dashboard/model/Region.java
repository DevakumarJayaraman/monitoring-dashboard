package com.monitoring.dashboard.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Master entity representing a deployment region (APAC, EMEA, NAM, etc.).
 */
@Entity
@Table(name = "ops_regions",
       uniqueConstraints = @UniqueConstraint(name = "uk_ops_regions_code", columnNames = "region_code"))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Region {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "region_id")
    private Integer regionId;

    @Column(name = "region_code", nullable = false, length = 20)
    private String regionCode;

    @Column(name = "region_desc", length = 100)
    private String regionDesc;

    @OneToMany(mappedBy = "region", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProjectEnvironmentMapping> projectMappings = new ArrayList<>();

    public Region(String regionCode, String regionDesc) {
        this.regionCode = regionCode;
        this.regionDesc = regionDesc;
    }
}
