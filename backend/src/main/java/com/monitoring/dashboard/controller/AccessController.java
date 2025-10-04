package com.monitoring.dashboard.controller;

import com.monitoring.dashboard.service.AccessService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST controller exposing an endpoint to retrieve permissions for a role/environment.
 * Clients should call {@code /api/access/{role}/{env}} and will receive a JSON
 * response containing the list of allowed function codes.
 */
@RestController
@RequestMapping("/api/access")
public class AccessController {
    private final AccessService accessService;

    public AccessController(AccessService accessService) {
        this.accessService = accessService;
    }

    /**
     * Return the permissions granted to a role in a particular environment.
     *
     * @param role the name of the role (case-sensitive)
     * @param env the environment code
     * @return a map containing the role, environment and permitted function codes
     */
    @GetMapping("/{role}/{env}")
    public Map<String, Object> getPermissions(@PathVariable String role, @PathVariable String env) {
        List<String> permissions = accessService.getPermissions(role, env);
        Map<String, Object> response = new HashMap<>();
        response.put("role", role);
        response.put("env", env);
        response.put("permissions", permissions);
        return response;
    }
}