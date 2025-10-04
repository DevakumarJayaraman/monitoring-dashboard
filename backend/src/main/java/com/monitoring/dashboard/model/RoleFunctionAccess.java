package com.monitoring.dashboard.model;

import jakarta.persistence.*;

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
public class RoleFunctionAccess {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "access_id")
    private Long accessId;

    @Column(name = "role_name", nullable = false)
    private String roleName;

    @Column(name = "function_code", nullable = false)
    private String functionCode;

    @Column(name = "env_code", nullable = true, length = 50)
    private String envCode;

    @Column(name = "allowed", length = 1)
    private String allowed;

    /**
     * Version field for JPA optimistic locking. Incremented automatically on update.
     */
    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    public RoleFunctionAccess() {
        // Default constructor required by JPA
    }

    public RoleFunctionAccess(String roleName, String functionCode, String envCode, String allowed) {
        this.roleName = roleName;
        this.functionCode = functionCode;
        this.envCode = envCode;
        this.allowed = allowed;
    }

    // Getters and setters

    public Long getAccessId() {
        return accessId;
    }

    public void setAccessId(Long accessId) {
        this.accessId = accessId;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public String getFunctionCode() {
        return functionCode;
    }

    public void setFunctionCode(String functionCode) {
        this.functionCode = functionCode;
    }

    public String getEnvCode() {
        return envCode;
    }

    public void setEnvCode(String envCode) {
        this.envCode = envCode;
    }

    public String getAllowed() {
        return allowed;
    }

    public void setAllowed(String allowed) {
        this.allowed = allowed;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    @Override
    public String toString() {
        return "RoleFunctionAccess{" +
                "accessId=" + accessId +
                ", roleName='" + roleName + '\'' +
                ", functionCode='" + functionCode + '\'' +
                ", envCode='" + envCode + '\'' +
                ", allowed='" + allowed + '\'' +
                ", version=" + version +
                '}';
    }
}