import { usePermissions } from "../context/PermissionsContext";

/**
 * Custom hook that returns a boolean indicating whether the current user
 * possesses the given function code in their permission set. Components
 * can call this to conditionally enable or disable UI actions.
 *
 * @param functionCode The code of the function/permission to check
 * @returns true if the permission exists, false otherwise
 */
export function useHasPermission(functionCode: string): boolean {
  const { permissions } = usePermissions();
  return permissions.includes(functionCode);
}