import { useCallback, useEffect, useMemo, useState } from "react";
import type { JSX } from "react";

import type { Project } from "../../types/project.ts";
import {
  createComponentDeployments,
  fetchComponentDeploymentsByProject,
  fetchComponentsByProject,
  fetchInfrastructureDetailsByProject,
  fetchAllProfiles,
  type ApiComponent,
  type ApiComponentDeployment,
  type InfraDetailDTO,
  type CreateComponentDeploymentsPayload,
} from "../../services/api.ts";

type ToastType = "success" | "error" | "info" | "warning";

interface DeploymentConfigViewProps {
  selectedProject: Project;
  onShowToast: (message: string, type?: ToastType) => void;
}

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 11);
};

type DraftEntry = {
  id: string;
  componentId: string;
  infraType: string;
  infraId: string;
  profile: string;
  dynamicParams: string;
};

const createEmptyEntry = (componentId: string, infraType: string): DraftEntry => ({
  id: generateId(),
  componentId,
  infraType,
  infraId: "",
  profile: "",
  dynamicParams: "",
});

interface DeploymentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  components: ApiComponent[];
  infrastructures: InfraDetailDTO[];
  profiles: string[];
  onSave: (payload: CreateComponentDeploymentsPayload) => Promise<void>;
}

function DeploymentConfigModal({ isOpen, onClose, components, infrastructures, profiles, onSave }: DeploymentConfigModalProps): JSX.Element | null {
  const [selectedComponentId, setSelectedComponentId] = useState<string>("");
  const [selectedInfraType, setSelectedInfraType] = useState<string>("");
  const [entries, setEntries] = useState<DraftEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedComponentId(components[0]?.componentId?.toString() ?? "");
      const defaultInfraType = infrastructures[0]?.infraType?.toUpperCase() ?? "";
      setSelectedInfraType(defaultInfraType);
      setEntries([createEmptyEntry(components[0]?.componentId?.toString() ?? "", defaultInfraType)]);
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen]);

  const infraTypes = useMemo(() => {
    const types = infrastructures.map(infra => infra.infraType.toUpperCase());
    return Array.from(new Set(types));
  }, [infrastructures]);

  const infrastructuresByType = useMemo(() => {
    return infrastructures.reduce<Record<string, InfraDetailDTO[]>>((acc, infra) => {
      const key = infra.infraType.toUpperCase();
      if (!acc[key]) acc[key] = [];
      acc[key].push(infra);
      return acc;
    }, {});
  }, [infrastructures]);

  const handleEntryChange = (id: string, field: keyof DraftEntry, value: string) => {
    setEntries(prev => prev.map(entry => {
      if (entry.id !== id) return entry;
      return { ...entry, [field]: value } as DraftEntry;
    }));
  };

  const addEntry = () => {
    setEntries(prev => [...prev, createEmptyEntry(selectedComponentId, selectedInfraType)]);
  };

  const removeEntry = (id: string) => {
    setEntries(prev => (prev.length === 1 ? prev : prev.filter(entry => entry.id !== id)));
  };

  const validateEntries = (): { valid: boolean; payload?: CreateComponentDeploymentsPayload; message?: string } => {
    if (entries.length === 0) {
      return { valid: false, message: "Add at least one deployment mapping." };
    }

    const payloadEntries: CreateComponentDeploymentsPayload["deployments"] = [];
    const seen = new Set<string>();

    for (const entry of entries) {
      if (!entry.componentId) {
        return { valid: false, message: "Select a service for each mapping." };
      }
      if (!entry.infraType) {
        return { valid: false, message: "Select an infrastructure type for each mapping." };
      }
      if (!entry.infraId) {
        return { valid: false, message: "Select an infrastructure instance for each mapping." };
      }
      if (!entry.profile) {
        return { valid: false, message: "Select a profile for each mapping." };
      }

      let parsedParams: Record<string, string> | undefined;
      if (entry.dynamicParams.trim()) {
        const tuples = entry.dynamicParams.split(",")
          .map(token => token.trim())
          .filter(Boolean)
          .map(token => token.split("=").map(part => part.trim()))
          .filter(parts => parts.length === 2 && parts[0] && parts[1]) as Array<[string, string]>;

        if (tuples.length === 0) {
          return { valid: false, message: "Dynamic parameters must be in key=value format separated by commas." };
        }

        parsedParams = tuples.reduce<Record<string, string>>((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
      }

      const key = `${entry.componentId}-${entry.infraId}-${entry.profile}`;
      if (seen.has(key)) {
        return { valid: false, message: "Duplicate mappings detected. Each service/infra/profile combination must be unique." };
      }
      seen.add(key);

      payloadEntries.push({
        componentId: Number(entry.componentId),
        infraId: Number(entry.infraId),
        profile: entry.profile,
        dynamicParams: parsedParams,
      });
    }

    return { valid: true, payload: { deployments: payloadEntries } };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    const validation = validateEntries();
    if (!validation.valid || !validation.payload) {
      setError(validation.message ?? "Invalid deployment configuration");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave(validation.payload);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save deployment configuration";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between border-b border-slate-700 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/20 p-2">
              <svg className="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-2 8l-4-4h8l-4 4zM5 4h14a1 1 0 011 1v12a1 1 0 01-1 1H9l-4 4V5a1 1 0 011-1z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Add Deployment Configuration</h2>
              <p className="text-sm text-slate-400">Map services to infrastructure profiles for automated deployments.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border border-slate-700/60 bg-slate-900/50 p-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Service <span className="text-rose-400">*</span>
                </label>
                <select
                  value={selectedComponentId}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedComponentId(value);
                    setEntries(prev => prev.map(entry => ({ ...entry, componentId: value })));
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                >
                  <option value="">Select service</option>
                  {components.map(component => (
                    <option key={component.componentId} value={component.componentId}>
                      {component.componentName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Infrastructure Type <span className="text-rose-400">*</span>
                </label>
                <select
                  value={selectedInfraType}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedInfraType(value);
                    setEntries(prev => prev.map(entry => ({ ...entry, infraType: value, infraId: "" })));
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                >
                  <option value="">Select type</option>
                  {infraTypes.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {entries.map((entry, index) => {
              const infraOptions = selectedInfraType
                ? infrastructuresByType[selectedInfraType] ?? []
                : infrastructures;

              return (
                <div
                  key={entry.id}
                  className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-300">Mapping #{index + 1}</span>
                    {entries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEntry(entry.id)}
                        className="text-xs text-rose-300 hover:text-rose-200"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Infrastructure Instance <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={entry.infraId}
                        onChange={(event) => handleEntryChange(entry.id, "infraId", event.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required
                        disabled={!selectedInfraType && infraTypes.length > 0}
                      >
                        <option value="">Select infrastructure</option>
                        {infraOptions.map(infra => (
                          <option key={infra.infraId} value={infra.infraId}>
                            {infra.hostname} • {infra.environment}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Profile <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={entry.profile}
                        onChange={(event) => handleEntryChange(entry.id, "profile", event.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select profile</option>
                        {profiles.map(profile => (
                          <option key={profile} value={profile}>
                            {profile.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Dynamic Parameters
                      </label>
                      <input
                        type="text"
                        value={entry.dynamicParams}
                        onChange={(event) => handleEntryChange(entry.id, "dynamicParams", event.target.value)}
                        placeholder="key1=value1, key2=value2"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-xs text-slate-500">Optional key=value metadata per deployment.</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={addEntry}
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-300 hover:text-emerald-200"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5" />
              </svg>
              Add Mapping
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-700 rounded-lg transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-70"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Mappings"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DeploymentConfigView({ selectedProject, onShowToast }: DeploymentConfigViewProps): JSX.Element {
  const [deployments, setDeployments] = useState<ApiComponentDeployment[]>([]);
  const [components, setComponents] = useState<ApiComponent[]>([]);
  const [infrastructures, setInfrastructures] = useState<InfraDetailDTO[]>([]);
  const [profiles, setProfiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMetadataLoading, setIsMetadataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const infraTypes = useMemo(() => {
    const types = infrastructures.map(infra => infra.infraType.toUpperCase());
    return Array.from(new Set(types));
  }, [infrastructures]);

  const loadDeployments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [deploymentData] = await Promise.all([
        fetchComponentDeploymentsByProject(Number(selectedProject.id)),
      ]);
      setDeployments(deploymentData);
    } catch (err) {
      console.error("Failed to load deployment configurations:", err);
      setError(err instanceof Error ? err.message : "Failed to load deployment configurations");
    } finally {
      setIsLoading(false);
    }
  }, [selectedProject.id]);

  const loadMetadata = useCallback(async () => {
    try {
      setIsMetadataLoading(true);
      const projectId = Number(selectedProject.id);
      const [componentData, infraData, profileData] = await Promise.all([
        fetchComponentsByProject(projectId),
        fetchInfrastructureDetailsByProject(projectId),
        fetchAllProfiles(),
      ]);

      setComponents(componentData);
      setInfrastructures(infraData);
      setProfiles(profileData);
    } catch (err) {
      console.error("Failed to load deployment metadata:", err);
      setError(err instanceof Error ? err.message : "Failed to load deployment metadata");
    } finally {
      setIsMetadataLoading(false);
    }
  }, [selectedProject.id]);

  useEffect(() => {
    loadMetadata();
    loadDeployments();
  }, [loadMetadata, loadDeployments]);

  const handleCreateDeployments = async (payload: CreateComponentDeploymentsPayload) => {
    await createComponentDeployments(payload);
    onShowToast("Deployment mappings created successfully.", "success");
    await loadDeployments();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Deployment Configuration</h1>
          <p className="text-sm text-slate-400">
            Manage service deployment mappings for <span className="text-emerald-300 font-medium">{selectedProject.name}</span> across infrastructure profiles.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:opacity-70"
          disabled={isMetadataLoading || components.length === 0 || infrastructures.length === 0 || profiles.length === 0}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Configuration
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 shadow-inner">
        <div className="border-b border-slate-800 px-4 py-3 text-sm text-slate-400 flex items-center justify-between">
          <span>{isLoading ? "Loading deployment mappings..." : `${deployments.length} deployment mapping${deployments.length === 1 ? "" : "s"}`}</span>
          <span className="text-xs text-slate-500">Infra types available: {infraTypes.length || 0}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Service</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Infrastructure</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Profile</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Port</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-900/40">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-400">
                    Fetching deployment configurations...
                  </td>
                </tr>
              ) : deployments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                    No deployment mappings found for this project. Click "Add Configuration" to create one.
                  </td>
                </tr>
              ) : (
                deployments.map(mapping => (
                  <tr key={mapping.mappingId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-100 font-medium">
                      {mapping.componentName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-200">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-100">{mapping.hostname ?? "Unknown host"}</span>
                        <span className="text-xs text-slate-400">{mapping.infraType.toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-emerald-300 font-semibold">
                      {mapping.profile.toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {mapping.port ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DeploymentConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        components={components}
        infrastructures={infrastructures}
        profiles={profiles}
        onSave={handleCreateDeployments}
      />
    </div>
  );
}
