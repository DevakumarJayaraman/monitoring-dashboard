package com.monitoring.dashboard.repository;

import com.monitoring.dashboard.model.RoleFunctionAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

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
     * Find a specific access mapping by role, function code, and environment code.
     *
     * @param roleName the name of the role
     * @param functionCode the function code
     * @param envCode the environment code
     * @return Optional containing the access mapping if found
     */
    Optional<RoleFunctionAccess> findByRoleNameAndFunctionCodeAndEnvCode(String roleName, 
                                                                           String functionCode, 
                                                                           String envCode);

    /**
     * Find all mappings for a specific role.
     *
     * @param roleName the name of the role
     * @return list of all access mappings for this role
     */
    List<RoleFunctionAccess> findByRoleName(String roleName);

    /**
     * Find all mappings for a specific function code.
     *
     * @param functionCode the function code
     * @return list of all access mappings for this function
     */
    List<RoleFunctionAccess> findByFunctionCode(String functionCode);

    /**
     * Find all mappings for a specific environment code.
     *
     * @param envCode the environment code
     * @return list of all access mappings for this environment
     */
    List<RoleFunctionAccess> findByEnvCode(String envCode);

    /**
     * Fetch all RoleFunctionAccess entries for a given role name and null environment
     * @param roleName the name of the role
     * @return list of matching {@link RoleFunctionAccess} rows with null environment
     */
    List<RoleFunctionAccess> findByRoleNameAndEnvCodeIsNull(String roleName);
}