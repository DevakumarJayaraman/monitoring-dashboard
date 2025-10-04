package com.monitoring.dashboard.service;

import org.springframework.stereotype.Service;

import com.monitoring.dashboard.model.RoleFunctionAccess;
import com.monitoring.dashboard.repository.RoleFunctionAccessRepository;

import java.util.List;

/**
 * Service layer providing access control information for clients. Delegates to
 * {@link RoleFunctionAccessRepository} to fetch role/function mappings and
 * transforms the result into a simple list of allowed function codes.
 */
@Service
public class AccessService {
    private final RoleFunctionAccessRepository repository;

    public AccessService(RoleFunctionAccessRepository repository) {
        this.repository = repository;
    }

    /**
     * Retrieve all function codes allowed for the given role in the specified environment.
     *
     * Only entries with allowed flag set to "Y" will be returned. If no mapping is
     * present, an empty list is returned.
     *
     * @param roleName the role name
     * @param envCode the environment code
     * @return list of permitted function codes
     */
    public List<String> getPermissions(String roleName, String envCode) {
        List<String> envPermissions = repository.findByRoleNameAndEnvCode(roleName, envCode)
            .stream()
            .filter(r -> "Y".equalsIgnoreCase(r.getAllowed()))
            .map(RoleFunctionAccess::getFunctionCode)
            .toList();
        List<String> nullEnvPermissions = repository.findByRoleNameAndEnvCodeIsNull(roleName)
            .stream()
            .filter(r -> "Y".equalsIgnoreCase(r.getAllowed()))
            .map(RoleFunctionAccess::getFunctionCode)
            .toList();
        return java.util.stream.Stream.concat(envPermissions.stream(), nullEnvPermissions.stream())
            .distinct()
            .toList();
    }
}