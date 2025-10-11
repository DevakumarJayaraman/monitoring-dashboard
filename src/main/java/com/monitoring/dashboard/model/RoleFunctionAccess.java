package com.monitoring.dashboard.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity representing a mapping between a user role, a function code and an environment code.
 * Each row indicates whether a particular role is allowed to perform the specified
 * function in a given environment. The {@code allowed} field stores a flag ("Y"/"N").
 * 
 * If env_code is NULL, the access permission applies to ALL environments (environment-agnostic).
 * This allows for global permissions that are not restricted to specific environments.
 *
 * The table name mirrors the existing access control naming used in our schema.
 */
@Entity
@Table(name = "ops_role_function_access")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleFunctionAccess {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "accessId")
    private Long accessId;

    @Column(name = "roleName", nullable = false)
    private String roleName;

    @Column(name = "functionCode", nullable = false)
    private String functionCode;

    @Column(name = "envCode", length = 50)
    private String envCode;

    @Column(name = "allowed", length = 1)
    private String allowed;

    /**
     * Version field for JPA optimistic locking. Incremented automatically on update.
     */
    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    public RoleFunctionAccess(String roleName, String functionCode, String envCode, String allowed) {
        this.roleName = roleName;
        this.functionCode = functionCode;
        this.envCode = envCode;
        this.allowed = allowed;
    }
}