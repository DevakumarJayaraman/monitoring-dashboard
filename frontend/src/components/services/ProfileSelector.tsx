import { useEffect, useState, useMemo } from "react";
import type { JSX } from "react";
import type { ServiceProfileKey, ServicesInstance } from "../../types/infrastructure.ts";
import { profileOrder } from "../../features/infrastructure/config.tsx";
import { fetchAllProfiles } from "../../services/api.ts";
import type { EnvironmentFilter } from "./ServicesSummary.tsx";

type ProfileSelectorProps = {
  value: ServiceProfileKey[];
  onChange: (profiles: ServiceProfileKey[]) => void;
  environmentFilter: EnvironmentFilter;
  servicesInstances: ServicesInstance[];
};

export function ProfileSelector({ value, onChange, environmentFilter, servicesInstances }: ProfileSelectorProps): JSX.Element {
  const [availableProfiles, setAvailableProfiles] = useState<string[]>(profileOrder);
  const [isLoading, setIsLoading] = useState(true);
  
  // Build profile to environment type mapping from servicesInstances
  const profileEnvMap = useMemo(() => {
    const envMap: Record<string, string> = {};
    servicesInstances.forEach((instance) => {
      if (instance.profile && instance.envType) {
        envMap[instance.profile] = instance.envType;
      }
    });
    return envMap;
  }, [servicesInstances]);

  // Load profiles from backend
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const backendProfiles = await fetchAllProfiles();
        // Combine with "all" and sort
        const allProfiles = ["all", ...backendProfiles.sort()];
        setAvailableProfiles(allProfiles);
      } catch (error) {
        console.error('Failed to load profiles, using defaults:', error);
        // Fallback to default profiles
        setAvailableProfiles(profileOrder);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfiles();
  }, []);
  
  // Filter profiles based on environment filter
  const filteredProfiles = useMemo(() => {
    if (environmentFilter === 'ALL') {
      return availableProfiles;
    }
    
    // Always include "all" button
    const filtered = ["all"];
    
    availableProfiles.forEach(profile => {
      if (profile === "all") return; // Already added
      
      const envType = profileEnvMap[profile];
      if (!envType) {
        // If no env mapping, include it (backwards compatibility)
        filtered.push(profile);
        return;
      }
      
      // Match based on filter
      if (environmentFilter === 'DEV' && envType === 'DEV') {
        filtered.push(profile);
      } else if (environmentFilter === 'STAGING' && envType === 'STAGING') {
        filtered.push(profile);
      } else if (environmentFilter === 'PROD_COB' && (envType === 'PROD' || envType === 'COB')) {
        filtered.push(profile);
      }
    });
    
    return filtered;
  }, [availableProfiles, environmentFilter, profileEnvMap]);
  
  const handleToggle = (profile: ServiceProfileKey) => {
    if (profile === "all") {
      // If "all" is clicked, select all filtered profiles (excluding "all" itself)
      const allFilteredProfiles = filteredProfiles.filter(p => p !== "all") as ServiceProfileKey[];
      
      // If all filtered profiles are already selected, deselect them
      const allSelected = allFilteredProfiles.every(p => value.includes(p));
      
      if (allSelected) {
        onChange([]);
      } else {
        onChange(allFilteredProfiles);
      }
    } else {
      // For specific profiles
      const currentWithoutAll = value.filter(p => p !== "all");
      if (currentWithoutAll.includes(profile)) {
        // Remove this profile
        const newSelection = currentWithoutAll.filter(p => p !== profile);
        onChange(newSelection);
      } else {
        // Add this profile
        const newSelection = [...currentWithoutAll, profile];
        onChange(newSelection);
      }
    }
  };

  const isSelected = (profile: ServiceProfileKey) => {
    if (profile === "all") {
      // "all" is selected if all filtered profiles (excluding "all" itself) are selected
      const allFilteredProfiles = filteredProfiles.filter(p => p !== "all");
      return allFilteredProfiles.length > 0 && allFilteredProfiles.every(p => value.includes(p));
    }
    return value.includes(profile);
  };

  const buttonClass = (profile: ServiceProfileKey) =>
    isSelected(profile)
      ? "border-transparent bg-emerald-400/90 text-emerald-950 shadow-sm"
      : "border border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-400/60 hover:text-emerald-200";

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Profile
        </label>
        <div className="text-sm text-slate-500">Loading profiles...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Profile
      </label>
      <div className="flex flex-col gap-3">
        <div
          className="hidden gap-2 overflow-x-auto rounded-full border border-slate-800 bg-slate-900 p-2 md:flex"
          role="group"
          aria-label="Service profiles"
        >
          {filteredProfiles.map((profile) => (
            <button
              key={profile}
              type="button"
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 ${buttonClass(
                profile as ServiceProfileKey
              )}`}
              onClick={() => handleToggle(profile as ServiceProfileKey)}
              aria-pressed={isSelected(profile as ServiceProfileKey)}
            >
              {profile}
            </button>
          ))}
        </div>
        <div className="md:hidden">
          <select
            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
            value={value.length === 1 ? value[0] : ""}
            onChange={(event) => {
              const selectedProfile = event.target.value as ServiceProfileKey;
              if (selectedProfile && !isSelected(selectedProfile)) {
                handleToggle(selectedProfile);
              }
            }}
          >
            <option value="">{value.length === 0 ? "Select profiles" : `${value.length} selected`}</option>
            {filteredProfiles.map((profile) => (
              <option key={profile} value={profile}>
                {profile} {isSelected(profile as ServiceProfileKey) ? "✓" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
