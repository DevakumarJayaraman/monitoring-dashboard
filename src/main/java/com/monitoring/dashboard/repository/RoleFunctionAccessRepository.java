package com.monitoring.dashboard.repository;

import com.monitoring.dashboard.model.RoleFunctionAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for {@link RoleFunctionAccess} entities. Exposes methods to
 * retrieve access mappings for role, function, and environment combinations.
 * Spring Data JPA will automatically generate the implementation at runtime.
 */
@Repository
public interface RoleFunctionAccessRepository extends JpaRepository<RoleFunctionAccess, Long> {

    /**
     * Find all mappings for the specified role name and environment code.
     *
     * @param roleName the name of the role (e.g. "Support", "Developer", "Admin")
     * @param envCode the environment code (e.g. "DEV", "STAGING", "PROD")
     * @return list of matching {@link RoleFunctionAccess} rows
     */
    List<RoleFunctionAccess> findByRoleNameAndEnvCode(String roleName, String envCode);


    /**
     * Fetch all RoleFunctionAccess entries for a given role name and null environment
     * @param roleName the name of the role
     * @return list of matching {@link RoleFunctionAccess} rows with null environment
     */
    List<RoleFunctionAccess> findByRoleNameAndEnvCodeIsNull(String roleName);
}