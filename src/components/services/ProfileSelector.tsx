import type { JSX } from "react";
import type { ServiceProfileKey } from "../../types/infrastructure";
import { profileLabels, profileOrder } from "../../features/infrastructure/config";

type ProfileSelectorProps = {
  value: ServiceProfileKey[];
  onChange: (profiles: ServiceProfileKey[]) => void;
};

export function ProfileSelector({ value, onChange }: ProfileSelectorProps): JSX.Element {
  const handleToggle = (profile: ServiceProfileKey) => {
    if (profile === "all") {
      // If "all" is clicked, toggle between "all" only and empty selection
      onChange(value.includes("all") ? [] : ["all"]);
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

  const isSelected = (profile: ServiceProfileKey) => value.includes(profile);

  const buttonClass = (profile: ServiceProfileKey) =>
    isSelected(profile)
      ? "border-transparent bg-emerald-400/90 text-emerald-950 shadow-sm"
      : "border border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-400/60 hover:text-emerald-200";

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
          {profileOrder.map((profile) => (
            <button
              key={profile}
              type="button"
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 ${buttonClass(
                profile
              )}`}
              onClick={() => handleToggle(profile)}
              aria-pressed={isSelected(profile)}
            >
              {profileLabels[profile]}
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
            {profileOrder.map((profile) => (
              <option key={profile} value={profile}>
                {profileLabels[profile]} {isSelected(profile) ? "✓" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
