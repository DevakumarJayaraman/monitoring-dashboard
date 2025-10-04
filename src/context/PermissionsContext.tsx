import React, { createContext, useContext, useEffect, useState } from "react";

/**
 * Context providing the list of function codes permitted for the current user role
 * and environment. The permissions are fetched from the backend on mount and
 * whenever the role or environment changes.
 */
interface PermissionsContextProps {
  permissions: string[];
}

const PermissionsContext = createContext<PermissionsContextProps>({ permissions: [] });

interface PermissionsProviderProps {
  role: string;
  env: string;
  children: React.ReactNode;
}

/**
 * Provider component that fetches permissions for a given role/environment from
 * the backend and exposes them via context. In a production application the
 * role and environment would likely come from an auth token or user settings.
 */
export function PermissionsProvider({ role, env, children }: PermissionsProviderProps) {
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    async function fetchPermissions() {
      try {
        const response = await fetch(`/api/access/${role}/${env}`);
        const data = await response.json();
        setPermissions(data.permissions || []);
      } catch {
        setPermissions([]);
      }
    }
    fetchPermissions();
  }, [role, env]);

  return (
    <PermissionsContext.Provider value={{ permissions }}>
      {children}
    </PermissionsContext.Provider>
  );
}

/**
 * Hook to consume the permissions context.
 */
export function usePermissions(): PermissionsContextProps {
  return useContext(PermissionsContext);
}