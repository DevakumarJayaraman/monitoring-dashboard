# Access Control Matrix

## Overview
The access control system uses the `ops_role_function_access` table to define role-based permissions. When `env_code` is `NULL`, the permission applies to **ALL environments** (environment-agnostic access).

## Current Access Configuration

### Default Role (Read-Only)
| Role | Function | Environment | Allowed | Description |
|------|----------|-------------|---------|-------------|
| default | VIEW_ALL | STAGING | Y | Can view STAGING environment only |

### Support Role (Production Support)
| Role | Function | Environment | Allowed | Description |
|------|----------|-------------|---------|-------------|
| Support | VIEW_ALL | PROD | Y | Can view PROD environment |
| Support | MANAGE_SERVICES | PROD | Y | Can start/stop/restart services in PROD |
| Support | CONFIG_UPDATE | PROD | Y | Can update configurations in PROD |

**Summary:** Support has full operational access to PROD environment only (covers COB implicitly via UI logic).

### Developer Role (Development & Testing)
| Role | Function | Environment | Allowed | Description |
|------|----------|-------------|---------|-------------|
| Developer | VIEW_ALL | **NULL** | Y | **Can view ALL environments** |
| Developer | MANAGE_SERVICES | STAGING | Y | Can manage services in STAGING only |

**Summary:** Developers can view everywhere but can only manage services in STAGING.

### Admin Role (Full Access)
| Role | Function | Environment | Allowed | Description |
|------|----------|-------------|---------|-------------|
| Admin | VIEW_ALL | **NULL** | Y | **Can view ALL environments** |
| Admin | EDIT_INFRA | **NULL** | Y | **Can edit infrastructure in ALL environments** |
| Admin | EDIT_SERVICES | **NULL** | Y | **Can edit service definitions in ALL environments** |
| Admin | CONFIG_UPDATE | **NULL** | Y | **Can update configurations in ALL environments** |

**Summary:** Admins have full view and edit access to all environments but **CANNOT manage services** (start/stop/restart).

---

## Function Codes Explained

| Function Code | Description |
|---------------|-------------|
| VIEW_ALL | Read-only access to view services, infrastructure, and configurations |
| MANAGE_SERVICES | Can start, stop, restart services |
| CONFIG_UPDATE | Can update configuration files and settings |
| EDIT_INFRA | Can modify infrastructure resources |
| EDIT_SERVICES | Can modify service definitions |

---

## Environment Codes

| Environment | Description |
|-------------|-------------|
| DEV | Development environment |
| STAGING | Staging/Pre-production environment (includes various QA/UAT profiles) |
| PROD | Production environment (includes disaster recovery profiles) |
| **NULL** | **ALL environments - environment-agnostic access** |

---

## Access Matrix Visualization

### Full Permission Matrix

|  | DEV | STAGING | PROD |
|---|:---:|:-------:|:----:|
| **default** |
| VIEW_ALL | ❌ | ✅ | ❌ |
| MANAGE_SERVICES | ❌ | ❌ | ❌ |
| CONFIG_UPDATE | ❌ | ❌ | ❌ |
| EDIT_ALL | ❌ | ❌ | ❌ |

|  | DEV | STAGING | PROD |
|---|:---:|:-------:|:----:|
| **Support** |
| VIEW_ALL | ❌ | ❌ | ✅ |
| MANAGE_SERVICES | ❌ | ❌ | ✅ |
| CONFIG_UPDATE | ❌ | ❌ | ✅ |
| EDIT_ALL | ❌ | ❌ | ❌ |

|  | DEV | STAGING | PROD |
|---|:---:|:-------:|:----:|
| **Developer** |
| VIEW_ALL | ✅ (via NULL) | ✅ (via NULL) | ✅ (via NULL) |
| MANAGE_SERVICES | ❌ | ✅ | ❌ |
| CONFIG_UPDATE | ❌ | ❌ | ❌ |
| EDIT_ALL | ❌ | ❌ | ❌ |

|  | DEV | STAGING | PROD |
|---|:---:|:-------:|:----:|
| **Admin** |
| VIEW_ALL | ✅ (via NULL) | ✅ (via NULL) | ✅ (via NULL) |
| MANAGE_SERVICES | ❌ | ❌ | ❌ |
| CONFIG_UPDATE | ✅ (via NULL) | ✅ (via NULL) | ✅ (via NULL) |
| EDIT_INFRA | ✅ (via NULL) | ✅ (via NULL) | ✅ (via NULL) |
| EDIT_SERVICES | ✅ (via NULL) | ✅ (via NULL) | ✅ (via NULL) |

---

## Access Hierarchy

```
┌─────────────────────────────────────────────┐
│                   Admin                      │
│  • Full view/edit access to all environments│
│  • Can edit infra, services, configs         │
│  • CANNOT manage services (start/stop)      │
│  • Environment: NULL (all)                   │
└─────────────────────────────────────────────┘
                      ▲
                      │
    ┌─────────────────┴─────────────────┐
    │                                   │
┌───┴─────────────────┐    ┌───────────┴───────────┐
│    Developer        │    │      Support          │
│  • View: ALL envs   │    │  • View: PROD only    │
│  • Manage: STAGING  │    │  • Manage: PROD only  │
│  • Environment:     │    │  • Config: PROD only  │
│    - NULL (view)    │    │  • Environment: PROD  │
│    - STAGING (mgmt) │    │                       │
└─────────────────────┘    └───────────────────────┘
                      │
                      ▼
            ┌─────────────────────┐
            │      default        │
            │  • View: STAGING    │
            │  • Read-only access │
            │  • Environment:     │
            │    STAGING          │
            └─────────────────────┘
```

---

## NULL Environment Behavior

When `env_code = NULL` in the access table:
- ✅ Permission applies to **ALL environments** (DEV, STAGING, PROD)
- ✅ Provides environment-agnostic access
- ✅ Simplifies permission management for roles that need global access
- ✅ Overrides specific environment restrictions

### Example Query Logic
```java
// Check if user has access to a function in a specific environment
boolean hasAccess = accessRepository.findByRoleNameAndFunctionCodeAndEnvCode(role, function, env) != null
                 || accessRepository.findByRoleNameAndFunctionCodeAndEnvCode(role, function, null) != null;
// First check specific environment, then check if NULL (all environments) permission exists
```

---

## Security Best Practices

1. **Principle of Least Privilege**: Use specific environment codes when possible
2. **NULL for Global Roles**: Use NULL env_code only for roles that truly need access across all environments (Admin, read-only viewers)
3. **Explicit Denials**: Absence of a record means NO ACCESS (deny by default)
4. **Audit Trail**: The `version` field supports optimistic locking for concurrent updates
5. **Environment Isolation**: Production access should be tightly controlled

---

## Adding New Roles

To add a new role:

1. **Read-Only Role** (e.g., Auditor):
   ```java
   accessRepository.save(new RoleFunctionAccess("Auditor", "VIEW_ALL", null, "Y"));
   ```

2. **Environment-Specific Role** (e.g., QA Tester):
   ```java
   accessRepository.save(new RoleFunctionAccess("QATester", "VIEW_ALL", "STAGING", "Y"));
   accessRepository.save(new RoleFunctionAccess("QATester", "MANAGE_SERVICES", "STAGING", "Y"));
   ```

3. **Multi-Environment Role** (e.g., Release Manager):
   ```java
   accessRepository.save(new RoleFunctionAccess("ReleaseMgr", "VIEW_ALL", null, "Y"));
   accessRepository.save(new RoleFunctionAccess("ReleaseMgr", "MANAGE_SERVICES", "STAGING", "Y"));
   accessRepository.save(new RoleFunctionAccess("ReleaseMgr", "MANAGE_SERVICES", "PROD", "Y"));
   accessRepository.save(new RoleFunctionAccess("ReleaseMgr", "CONFIG_UPDATE", "PROD", "Y"));
   ```

---

## Database Schema

```sql
CREATE TABLE ops_role_function_access (
    access_id    NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    role_name    VARCHAR2(255) NOT NULL,
    function_code VARCHAR2(255) NOT NULL,
    env_code     VARCHAR2(50),  -- NULL = ALL environments
    allowed      VARCHAR2(1),   -- 'Y' or 'N'
    version      NUMBER(10) DEFAULT 0 NOT NULL
);

-- Index for performance
CREATE INDEX idx_role_function_env ON ops_role_function_access(role_name, function_code, env_code);
```

---

## Integration with UI

The UI should:
1. Check for specific environment permission first
2. Fall back to NULL (all environments) permission if not found
3. Display environment badges for specific access
4. Show "All Environments" badge when env_code is NULL
5. Filter available actions based on user's role and current environment context
