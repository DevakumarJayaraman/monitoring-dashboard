import { useCallback, useEffect, useMemo, useState } from "react";
import type { JSX } from "react";

import type { Project } from "../../types/project.ts";
import TableGrid from "../shared/TableGrid.tsx";
import {
  createDeploymentConfig,
  deleteDeploymentConfig,
  fetchComponentsByProject,
  fetchComponentDeploymentsByProject,
  fetchInfrastructureDetailsByProject,
  updateDeploymentConfig,
  type ApiComponentDeployment,
  type ApiComponentWithServices,
  type InfraDetailDTO,
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

type DeploymentStatus = "draft" | "saved" | "editing";

type DeploymentRow = {
  id: string;
  environment: string;
  region: string;
  infraId: string;
  infraHostname: string;
  profile: string;
  dynamicParams: string;
  configId?: number;
  port: string;
  status: DeploymentStatus;
  lastSaved?: {
    environment: string;
    region: string;
    infraId: string;
    infraHostname: string;
    profile: string;
    dynamicParams: string;
    port: string;
  };
};

interface AddDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  components: ApiComponentWithServices[];
  infrastructures: InfraDetailDTO[];
  configuredEnvironments: string[];
  configuredRegions: string[];
  configuredProfiles: string[];
  onRefresh: () => Promise<void>;
  defaultComponentId?: number | null;
  componentDefaultInfraType?: string;
  componentDefaultPort?: number | null;
  existingDeployments?: ApiComponentDeployment[];
}

function AddDeploymentModal({
  isOpen,
  onClose,
  components,
  infrastructures,
  configuredEnvironments,
  configuredRegions,
  configuredProfiles,
  onRefresh,
  defaultComponentId,
  componentDefaultInfraType,
  componentDefaultPort,
  existingDeployments,
}: AddDeploymentModalProps): JSX.Element | null {
  const [mappings, setMappings] = useState<DeploymentRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedComponentId, setSelectedComponentId] = useState<string>("");
  const [selectedInfraType, setSelectedInfraType] = useState<"linux" | "windows" | "ecs">("linux");
  const [selectedPort, setSelectedPort] = useState<string>("");

  useEffect(() => {
    if (!isOpen) {
      setMappings([]);
      setError(null);
      return;
    }

    const initialComponent = defaultComponentId
      ? components.find(component => component.componentId === defaultComponentId)
      : components[0];

    const firstDeployment = existingDeployments && existingDeployments.length ? existingDeployments[0] : undefined;

    const inferredInfraType = (initialComponent?.defaultInfraType || componentDefaultInfraType || firstDeployment?.infraType || "").toLowerCase();
    const infraType = (inferredInfraType === "linux" || inferredInfraType === "windows" || inferredInfraType === "ecs")
      ? (inferredInfraType as "linux" | "windows" | "ecs")
      : "linux";

    const defaultPortValue = initialComponent?.defaultPort
      ?? componentDefaultPort
      ?? firstDeployment?.port
      ?? null;

    const initialPortString = defaultPortValue != null
      ? String(defaultPortValue)
      : infraType === "ecs"
        ? "8080"
        : "";

    setSelectedComponentId(initialComponent?.componentId?.toString() || "");
    setSelectedInfraType(infraType);
    setSelectedPort(initialPortString);
    setError(null);

    if (existingDeployments && existingDeployments.length) {
      const populatedRows = existingDeployments.map(deployment => {
        const dynamicParamsString = deployment.dynamicParams && Object.keys(deployment.dynamicParams).length
          ? JSON.stringify(deployment.dynamicParams)
          : "";

        const rowPort = deployment.port != null ? String(deployment.port) : "";
        return {
          id: generateId(),
          environment: deployment.environment ?? "",
          region: deployment.region ?? "",
          infraId: deployment.infraId != null ? String(deployment.infraId) : "",
          infraHostname: deployment.hostname ?? "",
          profile: deployment.profile ?? "",
          dynamicParams: dynamicParamsString,
          configId: deployment.configId,
          port: rowPort,
          status: "saved" as DeploymentStatus,
          lastSaved: {
            environment: deployment.environment ?? "",
            region: deployment.region ?? "",
            infraId: deployment.infraId != null ? String(deployment.infraId) : "",
            infraHostname: deployment.hostname ?? "",
            profile: deployment.profile ?? "",
            dynamicParams: dynamicParamsString,
            port: rowPort,
          },
        };
      });

      setMappings(populatedRows.length ? populatedRows : [{
        id: generateId(),
        environment: configuredEnvironments[0] || "",
        region: configuredRegions[0] || "",
        infraId: "",
        infraHostname: "",
        profile: configuredProfiles.length ? configuredProfiles[0] : "",
        dynamicParams: "",
        port: initialPortString,
        status: "draft",
      }]);
    } else {
      setMappings([{
        id: generateId(),
        environment: configuredEnvironments[0] || "",
        region: configuredRegions[0] || "",
        infraId: "",
        infraHostname: "",
        profile: configuredProfiles.length ? configuredProfiles[0] : "",
        dynamicParams: "",
        port: initialPortString,
        status: "draft",
      }]);
    }
  }, [
    isOpen,
    components,
    configuredEnvironments,
    configuredRegions,
    configuredProfiles,
    defaultComponentId,
    componentDefaultInfraType,
    componentDefaultPort,
    existingDeployments,
  ]);

  useEffect(() => {
    setSelectedPort(prev => {
      if (selectedInfraType === "ecs") {
        return prev && prev.trim().length > 0 ? prev : "8080";
      }
      return prev;
    });
  }, [selectedInfraType]);

  const getFilteredInfrastructures = (environment: string, region: string) => {
    return infrastructures.filter(infra => {
      const envMatch = !environment || infra.environment === environment;
      const regionMatch = !region || infra.region === region;
      const typeMatch = infra.infraType === selectedInfraType;
      return envMatch && regionMatch && typeMatch;
    });
  };

  const handleRowChange = (id: string, field: keyof DeploymentRow, value: string) => {
    setMappings(prev => prev.map(row => {
      if (row.id !== id) return row;
      if (row.status === "saved") return row;

      const updated: DeploymentRow = { ...row, [field]: value };

      if (field === "port") {
        return updated;
      }

      if (field === "environment" || field === "region") {
        updated.infraId = "";
        updated.infraHostname = "";
      }

      if (field === "infraId") {
        const infra = infrastructures.find(i => i.infraId === parseInt(value, 10));
        updated.infraHostname = infra?.hostname || "";
      }

      return updated;
    }));
  };

  const handleAddMapping = () => {
    if (mappings.some(row => row.status !== "saved")) {
      setError("Please save the current mapping before adding another.");
      return;
    }
    const initialPort = selectedPort || (selectedInfraType === "ecs" ? "8080" : "");
    setMappings(prev => [
      ...prev,
      {
        id: generateId(),
        environment: configuredEnvironments[0] || "",
        region: configuredRegions[0] || "",
        infraId: "",
        infraHostname: "",
        profile: configuredProfiles.length ? configuredProfiles[0] : "",
        dynamicParams: "",
        port: initialPort,
        status: "draft",
      },
    ]);
  };

  const handleEditRow = (row: DeploymentRow) => {
    if (row.status !== "saved") {
      return;
    }

    if (mappings.some(current => current.status !== "saved" && current.id !== row.id)) {
      setError("Save or cancel the current mapping before editing another.");
      return;
    }

    setError(null);

    const infraIdNumber = parseInt(row.infraId, 10);
    if (!Number.isNaN(infraIdNumber)) {
      const infra = infrastructures.find(i => i.infraId === infraIdNumber);
      if (infra) {
        const inferredType = infra.infraType?.toLowerCase();
        if (inferredType === "linux" || inferredType === "windows" || inferredType === "ecs") {
          setSelectedInfraType(inferredType);
        }
      }
    }

    setMappings(prev => prev.map(current => {
      if (current.id !== row.id) {
        return current;
      }
      return {
        ...current,
        status: "editing",
      };
    }));
  };

  const handleSaveRow = async (id: string) => {
    if (isSaving) return;
    setError(null);

    const target = mappings.find(row => row.id === id);
    if (!target) return;
    const isEditing = target.status === "editing";

    if (!selectedComponentId) {
      setError("Select a service before saving a mapping.");
      return;
    }

    const componentIdNumber = parseInt(selectedComponentId, 10);
    if (Number.isNaN(componentIdNumber)) {
      setError("Invalid service selection.");
      return;
    }

    if (!target.environment) {
      setError("Environment is required for each mapping.");
      return;
    }

    if (!target.region) {
      setError("Region is required for each mapping.");
      return;
    }

    if (!target.infraId) {
      setError("Select an infrastructure target before saving.");
      return;
    }

    if (!target.profile) {
      setError("Profile is required for each mapping.");
      return;
    }

    const infraIdNumber = parseInt(target.infraId, 10);
    if (Number.isNaN(infraIdNumber)) {
      setError("Invalid infrastructure selection.");
      return;
    }

    const infra = infrastructures.find(i => i.infraId === infraIdNumber);
    if (!infra) {
      setError("Selected infrastructure is not available.");
      return;
    }

    const infraType = infra.infraType?.toLowerCase() ?? "";
    const rowPort = (target.port || "").trim();
    const fallbackPort = rowPort
      || (selectedPort && selectedPort.trim().length > 0 ? selectedPort.trim() : "")
      || (infraType === "ecs" ? "8080" : "");
    const parsedPort = fallbackPort ? parseInt(fallbackPort, 10) : NaN;

    if ((infraType === "windows" || infraType === "linux") && (fallbackPort === "" || Number.isNaN(parsedPort))) {
      setError("Port is required for Windows and Linux infrastructure.");
      return;
    }
    if (!Number.isNaN(parsedPort) && (parsedPort <= 0 || parsedPort > 65535)) {
      setError("Port must be between 1 and 65535.");
      return;
    }

    const rawParams = (target.dynamicParams || "").trim();
    let deployParams: Record<string, string> | undefined;
    if (rawParams) {
      try {
        if (rawParams.startsWith("{")) {
          const parsed = JSON.parse(rawParams);
          if (typeof parsed === "object" && parsed !== null) {
            deployParams = Object.entries(parsed as Record<string, unknown>)
              .reduce<Record<string, string>>((acc, [key, value]) => {
                if (value !== null && value !== undefined) {
                  acc[key] = String(value);
                }
                return acc;
              }, {});
          } else {
            throw new Error("Dynamic params JSON must describe an object");
          }
        } else {
          const tuples = rawParams
            .split(/\r?\n|,/) // newline or comma separated
            .map(token => token.trim())
            .filter(Boolean)
            .map(token => token.split("=").map(part => part.trim()))
            .filter(parts => parts.length === 2 && parts[0] && parts[1]) as Array<[string, string]>;

          if (tuples.length === 0) {
            throw new Error("Provide key=value pairs separated by comma or newline");
          }

          deployParams = tuples.reduce<Record<string, string>>((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {});
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Invalid dynamic params";
        setError(message);
        return;
      }
    } else {
      deployParams = {};
    }

    try {
      setIsSaving(true);
      const basePortNumber = Number.isNaN(parsedPort)
        ? (infraType === "ecs" ? 8080 : undefined)
        : parsedPort;

      if (basePortNumber == null) {
        setError("Port is required for this infrastructure.");
        setIsSaving(false);
        return;
      }

      const hasDeployParams = deployParams != null && Object.keys(deployParams).length > 0;

      const createPayload = {
        componentId: componentIdNumber,
        infraId: infraIdNumber,
        profile: target.profile,
        basePort: basePortNumber,
        ...(hasDeployParams ? { deployParams } : {}),
      };

      const updatePayload = {
        componentId: componentIdNumber,
        infraId: infraIdNumber,
        profile: target.profile,
        basePort: basePortNumber,
        deployParams: hasDeployParams ? deployParams : {},
      };

      const response = isEditing && target.configId
        ? await updateDeploymentConfig(target.configId, updatePayload)
        : await createDeploymentConfig(createPayload);

      const savedPortString = !Number.isNaN(parsedPort)
        ? String(parsedPort)
        : infraType === "ecs"
          ? "8080"
          : "";

      setMappings(prev => prev.map(row => {
        if (row.id !== id) return row;
        return {
          ...row,
          configId: response.configId ?? target.configId,
          infraHostname: infra.hostname || "",
          port: savedPortString,
          status: "saved",
          lastSaved: {
            environment: row.environment,
            region: row.region,
            infraId: row.infraId,
            infraHostname: infra.hostname || "",
            profile: row.profile,
            dynamicParams: row.dynamicParams,
            port: savedPortString,
          },
        };
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save deployment mapping";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelRow = (id: string) => {
    setError(null);
    setMappings(prev => {
      const next = prev.reduce<DeploymentRow[]>((acc, row) => {
        if (row.id !== id) {
          acc.push(row);
          return acc;
        }

        if (!row.lastSaved) {
          return acc;
        }

        acc.push({
          ...row,
          ...row.lastSaved,
          status: "saved",
        });
        return acc;
      }, []);

      if (next.length === 0) {
        return [{
          id: generateId(),
          environment: configuredEnvironments[0] || "",
          region: configuredRegions[0] || "",
          infraId: "",
          infraHostname: "",
          profile: configuredProfiles.length ? configuredProfiles[0] : "",
          dynamicParams: "",
          port: selectedPort || (selectedInfraType === "ecs" ? "8080" : ""),
          status: "draft",
        }];
      }

      return next;
    });
  };

  const handleDeleteRow = async (row: DeploymentRow) => {
    if (row.status === "saved" && row.configId) {
      try {
        setIsSaving(true);
        await deleteDeploymentConfig(row.configId);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete deployment mapping";
        setError(message);
        setIsSaving(false);
        return;
      }
    }

    setMappings(prev => {
      const filtered = prev.filter(current => current.id !== row.id);
      if (filtered.length === 0) {
        return [{
          id: generateId(),
          environment: configuredEnvironments[0] || "",
          region: configuredRegions[0] || "",
          infraId: "",
          infraHostname: "",
          profile: configuredProfiles.length ? configuredProfiles[0] : "",
          dynamicParams: "",
          port: selectedPort || (selectedInfraType === "ecs" ? "8080" : ""),
          status: "draft",
        }];
      }
      return filtered;
    });

    setIsSaving(false);
  };

  const handleSubmit = async () => {
    if (mappings.length === 0) {
      setError("Add at least one deployment mapping before saving.");
      return;
    }

    const pendingRow = mappings.find(row => row.status !== "saved");
    if (pendingRow) {
      setError("Save or discard all in-progress mappings before closing.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onRefresh();
      onClose();
      setMappings([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to refresh deployment configurations";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const isPortRequired = selectedInfraType === "windows" || selectedInfraType === "linux";
  const isPortDisabled = selectedInfraType === "ecs";
  const hasProfiles = configuredProfiles.length > 0;

  const columns = [];

  columns.push(
    {
      header: "Environment *",
      accessor: "environment",
      Cell: ({ row }: { value: string; row: DeploymentRow }) => (
        <select
          value={row.environment}
          onChange={e => handleRowChange(row.id, "environment", e.target.value)}
          className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-100"
          disabled={row.status === "saved"}
        >
          <option value="">Select env</option>
          {configuredEnvironments.map(env => (
            <option key={env} value={env}>{env}</option>
          ))}
        </select>
      ),
    },
    {
      header: "Region *",
      accessor: "region",
      Cell: ({ row }: { value: string; row: DeploymentRow }) => (
        <select
          value={row.region}
          onChange={e => handleRowChange(row.id, "region", e.target.value)}
          className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-100"
          disabled={row.status === "saved" || !row.environment}
        >
          <option value="">Select region</option>
          {configuredRegions.map(region => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
      ),
    }
  );

  if (hasProfiles) {
    columns.push({
      header: "Profile *",
      accessor: "profile",
      Cell: ({ row }: { value: string; row: DeploymentRow }) => (
        <select
          value={row.profile}
          onChange={e => handleRowChange(row.id, "profile", e.target.value)}
          className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-100"
          disabled={row.status === "saved"}
        >
          <option value="">Select profile</option>
          {configuredProfiles.map(profile => (
            <option key={profile} value={profile}>{profile}</option>
          ))}
        </select>
      ),
    });
  }

  columns.push({
    header: "Infrastructure *",
    accessor: "infraHostname",
    Cell: ({ row }: { value: string; row: DeploymentRow }) => {
      const filteredInfras = getFilteredInfrastructures(row.environment, row.region);
      return (
        <select
          value={row.infraId}
          onChange={e => handleRowChange(row.id, "infraId", e.target.value)}
          className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-100"
          disabled={row.status === "saved" || !row.environment || !row.region}
        >
          <option value="">Select infra</option>
          {filteredInfras.map(infra => (
            <option key={infra.infraId} value={infra.infraId}>
              {infra.hostname}
            </option>
          ))}
        </select>
      );
    },
  });

  columns.push({
    header: "Port",
    accessor: "port",
    Cell: ({ row }: { value: string; row: DeploymentRow }) => (
      <input
        type="number"
        min={1}
        max={65535}
        value={row.port}
        onChange={e => handleRowChange(row.id, "port", e.target.value)}
        disabled={row.status === "saved"}
        className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-100"
        placeholder="Inherit"
      />
    ),
  });

  columns.push({
    header: "Dynamic Params",
    accessor: "dynamicParams",
    width: "25%",
    Cell: ({ row }: { value: string; row: DeploymentRow }) => (
      <div className="space-y-1">
        <textarea
          value={row.dynamicParams}
          onChange={e => handleRowChange(row.id, "dynamicParams", e.target.value)}
          placeholder="key1=value1&#10;key2=value2&#10;jvm_opts=-Xmx2g"
          rows={3}
          disabled={row.status === "saved"}
          className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/40 resize-y min-h-[60px]"
        />
        <p className="text-[10px] text-slate-500 leading-tight">
          Format: <code className="text-emerald-400/80">key=value</code> separated by comma or new line
        </p>
      </div>
    ),
  });

  const renderActions = (row: DeploymentRow) => {
    if (row.status === "saved") {
      const hasPendingDraft = mappings.some(current => current.status !== "saved" && current.id !== row.id);
      return (
        <div className="flex gap-2 items-center justify-center">
          <button
            type="button"
            onClick={() => handleEditRow(row)}
            disabled={isSaving || hasPendingDraft}
            className="rounded-md border border-transparent bg-slate-700/80 px-2 py-1 text-xs text-slate-200 transition hover:border-blue-500/70 hover:bg-blue-600/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            title={hasPendingDraft ? "Save or cancel existing edits before editing another mapping" : "Edit mapping"}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => handleDeleteRow(row)}
            disabled={isSaving}
            className="rounded-md border border-transparent bg-rose-600/80 px-2 py-1 text-xs text-rose-50 transition hover:border-rose-500 hover:bg-rose-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            title="Remove mapping"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      );
    }

    return (
      <div className="flex gap-2 items-center justify-center">
        <button
          type="button"
          onClick={() => handleCancelRow(row.id)}
          disabled={isSaving}
          className="rounded-md border border-transparent bg-slate-700/80 px-2 py-1 text-xs text-slate-200 transition hover:border-slate-400/80 hover:bg-slate-600/60 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          title="Cancel changes"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => handleSaveRow(row.id)}
          disabled={isSaving}
          className="rounded-md border border-transparent bg-emerald-600 px-2 py-1 text-xs text-white transition hover:border-emerald-500 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          title="Save mapping"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/20 p-2">
              <svg className="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-2 8l-4-4h8l-4 4zM5 4h14a1 1 0 011 1v12a1 1 0 01-1 1H9l-4 4V5a1 1 0 011-1z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Add Deployment Configuration</h2>
              <p className="text-sm text-slate-400">Map services to infrastructure with profiles for deployment</p>
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

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          )}

          {/* One-time Configuration Section */}
          <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
            <h3 className="text-sm font-semibold text-slate-200 mb-3">Deployment Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Service Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Service *
                </label>
                <select
                  value={selectedComponentId}
                  onChange={(e) => setSelectedComponentId(e.target.value)}
                  className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                >
                  <option value="">Select service</option>
                  {components.map(c => (
                    <option key={c.componentId} value={c.componentId}>
                      {c.componentName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Infrastructure Type Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Infrastructure Type *
                </label>
                <select
                  value={selectedInfraType}
                  onChange={(e) => setSelectedInfraType(e.target.value as 'linux' | 'windows' | 'ecs')}
                  className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                >
                  <option value="linux">Linux</option>
                  <option value="windows">Windows</option>
                  <option value="ecs">ECS</option>
                </select>
              </div>

              {/* Port Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Port {isPortRequired && '*'}
                  {selectedInfraType === 'ecs' && <span className="text-slate-500 ml-1">(Default: 8080)</span>}
                </label>
                <input
                  type="number"
                  value={selectedPort}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedPort(value);
                    setMappings(prev => prev.map(row => (
                      row.status === "saved" ? row : { ...row, port: value }
                    )));
                  }}
                  disabled={isPortDisabled}
                  placeholder={isPortDisabled ? '8080' : 'Enter port'}
                  className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Add Mapping Button */}
          <div className="flex justify-end">
            <button
              onClick={handleAddMapping}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                mappings.some(row => row.status !== "saved")
                  ? "cursor-not-allowed border border-slate-700 bg-slate-800 text-slate-500"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
              disabled={mappings.some(row => row.status !== "saved")}
              title={mappings.some(row => row.status !== "saved") ? "Save the current mapping before adding another" : "Add mapping"}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Mapping
            </button>
          </div>

          {/* Mappings Table */}
          <div className="rounded-lg border border-slate-700 bg-slate-900 overflow-x-auto">
            <TableGrid
              columns={columns}
              data={mappings}
              actions={renderActions}
            />
          </div>

          {/* Help Text */}
          <div className="rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3">
            <p className="text-xs text-slate-400">
              <strong className="text-slate-300">Note:</strong> Configure the service, infrastructure type, and port once above, then add multiple {hasProfiles ? 'profile' : 'environment/region'} and infrastructure mappings in the table below.
              {' '}Dynamic Parameters are optional per mapping and use format: <code className="text-emerald-400">key=value, key2=value2</code> (e.g., <code className="text-emerald-400">jvm_opts=-Xmx2g</code>)
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || mappings.some(row => row.status !== "saved")}
            className="rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2 text-sm font-semibold text-white hover:from-emerald-700 hover:to-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Deployments'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeploymentConfigView({ selectedProject, onShowToast }: DeploymentConfigViewProps): JSX.Element {
  const [deployments, setDeployments] = useState<ApiComponentDeployment[]>([]);
  const [components, setComponents] = useState<ApiComponentWithServices[]>([]);
  const [infrastructures, setInfrastructures] = useState<InfraDetailDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [componentForModal, setComponentForModal] = useState<number | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deploymentsForModal, setDeploymentsForModal] = useState<ApiComponentDeployment[] | undefined>(undefined);
  const [expandedComponentId, setExpandedComponentId] = useState<number | null>(null);

  // Get filtered options from project config
  const configuredEnvironments = selectedProject?.configuredEnvironments || [];
  const configuredRegions = selectedProject?.configuredRegions || [];
  const configuredProfiles = selectedProject?.configuredProfiles || [];

  // Load deployment data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const projectId = parseInt(selectedProject.id);

      const [comps, infras, deploys] = await Promise.all([
        fetchComponentsByProject(projectId),
        fetchInfrastructureDetailsByProject(projectId),
        fetchComponentDeploymentsByProject(projectId),
      ]);

      setComponents(comps);
      setInfrastructures(infras);
      setDeployments(deploys);
      setHasLoaded(true);
    } catch (error) {
      console.error('Failed to load deployment data:', error);
      const message = error instanceof Error ? error.message : 'Failed to load deployment configurations';
      setLoadError(message);
      onShowToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedProject.id, onShowToast]);

  useEffect(() => {
    setDeployments([]);
    setComponents([]);
    setInfrastructures([]);
    setHasLoaded(false);
    setLoadError(null);
    setIsLoading(false);
    setDeleteConfirmId(null);
    setComponentForModal(null);
    setIsModalOpen(false);
    setSearchQuery("");
    setDeploymentsForModal(undefined);
    setExpandedComponentId(null);
  }, [selectedProject.id]);

  const handleDeleteDeployment = async (deploymentId: number) => {
    try {
      await deleteDeploymentConfig(deploymentId);
      onShowToast('Deployment configuration deleted', 'success');
      setDeleteConfirmId(null);
      await loadData();
    } catch (error) {
      console.error('Failed to delete deployment:', error);
      onShowToast('Failed to delete deployment configuration', 'error');
    }
  };

  const deploymentsByComponent = useMemo(() => {
    const byId = new Map<number, ApiComponentDeployment[]>();
    const byName = new Map<string, ApiComponentDeployment[]>();

    deployments.forEach(deployment => {
      if (deployment.componentId != null) {
        if (!byId.has(deployment.componentId)) {
          byId.set(deployment.componentId, []);
        }
        byId.get(deployment.componentId)!.push(deployment);
      } else if (deployment.componentName) {
        const key = deployment.componentName.toLowerCase();
        if (!byName.has(key)) {
          byName.set(key, []);
        }
        byName.get(key)!.push(deployment);
      }
    });

    return { byId, byName };
  }, [deployments]);

  const infrastructureMap = useMemo(() => {
    const map = new Map<number, InfraDetailDTO>();
    infrastructures.forEach(infra => map.set(infra.infraId, infra));
    return map;
  }, [infrastructures]);

  const componentDeploymentData = useMemo(() => {
    const data = new Map<number, ApiComponentDeployment[]>();

    components.forEach(component => {
      if (component.componentId == null) {
        return;
      }

      const aggregatedById = deploymentsByComponent.byId.get(component.componentId) ?? [];
      const aggregatedByName = component.componentName
        ? deploymentsByComponent.byName.get(component.componentName.toLowerCase()) ?? []
        : [];

      const combinedAggregated: ApiComponentDeployment[] = [...aggregatedById];
      aggregatedByName.forEach(dep => {
        if (!combinedAggregated.some(existing => existing.configId === dep.configId && existing.infraId === dep.infraId)) {
          combinedAggregated.push(dep);
        }
      });

      const directDeployments = (component.deploymentConfigs ?? []).map(dc => {
        const matching = combinedAggregated.find(dep => dep.configId != null && dep.configId === dc.configId);
        const fallbackInfraId = matching?.infraId ?? dc.infraId ?? null;
        const infraDetails = fallbackInfraId != null ? infrastructureMap.get(fallbackInfraId) : undefined;

        return {
          configId: dc.configId ?? matching?.configId,
          componentId: component.componentId!,
          componentName: component.componentName,
          infraId: fallbackInfraId ?? infraDetails?.infraId ?? 0,
          infraType: matching?.infraType ?? infraDetails?.infraType,
          profile: matching?.profile ?? dc.profile ?? undefined,
          port: matching?.port ?? dc.basePort ?? undefined,
          hostname: matching?.hostname ?? infraDetails?.hostname,
          environment: matching?.environment ?? infraDetails?.environment,
          region: matching?.region ?? infraDetails?.region,
          dynamicParams: matching?.dynamicParams ?? dc.deployParams ?? undefined,
        } as ApiComponentDeployment;
      });

      const directConfigIds = new Set(directDeployments.map(dep => dep.configId).filter((id): id is number => id != null));

      const extras = combinedAggregated.filter(dep => dep.configId == null || !directConfigIds.has(dep.configId));

      data.set(component.componentId!, [...directDeployments, ...extras]);
    });

    return data;
  }, [components, deploymentsByComponent, infrastructureMap]);

  const visibleComponents = useMemo(() => {
    if (!hasLoaded) {
      return [];
    }

    const query = searchQuery.trim().toLowerCase();

    return components.reduce<Array<{ component: ApiComponentWithServices; deployments: ApiComponentDeployment[] }>>((acc, component) => {
      if (component.componentId == null) {
        return acc;
      }

      const deployments = componentDeploymentData.get(component.componentId) ?? [];

      if (!query) {
        acc.push({ component, deployments });
        return acc;
      }

      const componentMatches =
        component.componentName?.toLowerCase().includes(query) ||
        component.description?.toLowerCase().includes(query);

      const matchingDeployments = deployments.filter(dep =>
        dep.hostname?.toLowerCase().includes(query) ||
        dep.infraType?.toLowerCase().includes(query) ||
        dep.environment?.toLowerCase().includes(query) ||
        dep.region?.toLowerCase().includes(query) ||
        dep.profile?.toLowerCase().includes(query)
      );

      if (componentMatches) {
        acc.push({ component, deployments });
      } else if (matchingDeployments.length > 0) {
        acc.push({ component, deployments: matchingDeployments });
      }

      return acc;
    }, []);
  }, [components, componentDeploymentData, hasLoaded, searchQuery]);

  const handleOpenModal = (componentId?: number) => {
    const chosenId = componentId ?? null;
    setComponentForModal(chosenId);
    setDeploymentsForModal(chosenId != null ? componentDeploymentData.get(chosenId) ?? [] : []);
    setIsModalOpen(true);
  };

  const canAddDeployment = components.length > 0;
  const modalComponentDefaults = componentForModal != null
    ? components.find(component => component.componentId === componentForModal)
    : undefined;
  const toggleComponentExpanded = (componentId: number) => {
    setExpandedComponentId(prev => (prev === componentId ? null : componentId));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-600 border-t-emerald-400"></div>
          <div className="text-slate-400">Loading deployment configurations...</div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-red-400">Failed to load deployment data: {loadError}</div>
          <button
            type="button"
            onClick={() => loadData()}
            className="inline-flex items-center gap-2 rounded-lg border border-red-400/60 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Retry Load
          </button>
        </div>
      </div>
    );
  }

  if (!hasLoaded) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 text-center text-slate-300">
        <div>
          <p className="text-lg font-semibold text-slate-100">Deployment data not loaded</p>
          <p className="mt-1 text-sm text-slate-400">
            Load ops deployment configurations when you need them to keep the dashboard responsive.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadData()}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Load Deployment Data
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Deployment Configuration</h2>
          <p className="text-sm text-slate-400 mt-1">
            Service deployment mappings for {selectedProject.name}
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          disabled={!canAddDeployment}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-md transition ${
            canAddDeployment
              ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 hover:shadow-lg'
              : 'cursor-not-allowed border border-slate-700 bg-slate-800 text-slate-500'
          }`}
          title={canAddDeployment ? 'Add deployment mapping' : 'Create a service component before adding deployments'}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Deployment
        </button>
      </div>

      {/* Warning Banner */}
      {(configuredEnvironments.length === 0 || configuredRegions.length === 0 || configuredProfiles.length === 0) && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <div className="flex items-start gap-2">
            <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.924-1.333-2.664 0L3.732 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="font-semibold">Project Configuration Required</p>
              <p className="text-amber-300/80 mt-1">
                This project has no environment/region/profile mappings configured.
                Please edit the project to add mappings before creating deployments.
              </p>
            </div>
          </div>
        </div>
      )}

      {hasLoaded && components.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="flex flex-col gap-2 text-sm text-slate-300 sm:w-80">
            <span className="font-medium text-slate-200">Search services</span>
            <input
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-inner placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              type="search"
              name="deployment-search"
              placeholder="Search by service name"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
            />
          </label>
        </div>
      )}

      {/* Deployment Cards */}
      {hasLoaded && (
        components.length === 0 ? (
          <div className="rounded-lg border border-slate-700 bg-slate-900/40 px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
              <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-2 8l-4-4h8l-4 4zM5 4h14a1 1 0 011 1v12a1 1 0 01-1 1H9l-4 4V5a1 1 0 011-1z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-300">No Services Configured Yet</h3>
            <p className="mt-2 text-sm text-slate-400">
              Create a service component to start capturing deployment mappings.
            </p>
          </div>
        ) : visibleComponents.length === 0 ? (
          <div className="rounded-lg border border-slate-700 bg-slate-900/40 px-6 py-12 text-center text-sm text-slate-400">
            No services match “{searchQuery.trim()}”. Adjust your search or load more components.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-1 xl:grid-cols-1">
          {visibleComponents.map(({ component, deployments: visibleDeployments }) => {
              const componentId = component.componentId ?? -1;
              const allDeployments = componentDeploymentData.get(componentId) ?? [];
              const deploymentCount = allDeployments.length;
              const profileCount = new Set(allDeployments.map(dep => dep.profile).filter(Boolean)).size;
              const deploymentsToRender = visibleDeployments.length > 0 ? visibleDeployments : allDeployments;
              const isExpanded = expandedComponentId === componentId;

              return (
                <div
                  key={componentId}
                  className="rounded-xl border border-slate-700 bg-slate-900/60 p-5 shadow-lg shadow-slate-900/30 flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-100">{component.componentName}</h3>
                        {component.module && (
                          <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-blue-200">
                            {component.module}
                          </span>
                        )}
                      </div>
                      {component.description && (
                        <p className="text-sm text-slate-400">{component.description}</p>
                      )}
                      <p className="text-xs text-slate-500">
                        Default infra: {component.defaultInfraType ?? "-"} • Default port: {component.defaultPort ?? "-"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleComponentExpanded(componentId)}
                        className="rounded-full border border-slate-600 bg-slate-800 p-2 text-slate-300 transition hover:border-blue-500/60 hover:bg-blue-500/10 hover:text-blue-200"
                        aria-expanded={isExpanded}
                        title={isExpanded ? "Hide deployment details" : "Show deployment details"}
                      >
                        <svg
                          className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenModal(component.componentId)}
                        className="rounded-full border border-slate-600 bg-slate-800 p-2 text-slate-300 transition hover:border-blue-500/60 hover:bg-blue-500/10 hover:text-blue-200"
                        title="Edit deployment mappings"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wider text-slate-400">Deployments</p>
                      <p className="text-lg font-semibold text-slate-100">{deploymentCount}</p>
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wider text-slate-400">Profiles</p>
                      <p className="text-lg font-semibold text-slate-100">{profileCount}</p>
                    </div>
                  </div>

                  {deploymentsToRender.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 px-4 py-4 text-sm text-slate-400">
                      No deployment mappings yet. Use the add button to create one.
                    </div>
                  ) : !isExpanded ? (
                    <div className="rounded-lg border border-slate-700 bg-slate-900/40 px-4 py-4 text-xs text-slate-400">
                      {deploymentsToRender.length} deployment mapping{deploymentsToRender.length !== 1 ? "s" : ""} available. Use the chevron to view details.
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {deploymentsToRender.map(deployment => {
                        type DeploymentWithId = ApiComponentDeployment & { deploymentId?: number; id?: number };
                        const deploymentId =
                          (deployment as DeploymentWithId).deploymentId ??
                          deployment.configId ??
                          (deployment as DeploymentWithId).id ??
                          deployment.infraId;
                        const metadata = [
                          deployment.infraType ? deployment.infraType.toUpperCase() : null,
                          deployment.profile ? `Profile: ${deployment.profile}` : null,
                          deployment.environment ? `Env: ${deployment.environment}` : null,
                          deployment.region ? `Region: ${deployment.region}` : null,
                          deployment.port ? `Port: ${deployment.port}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ");

                        return (
                          <li
                            key={deploymentId}
                            className="rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-100">
                                  {deployment.hostname || `Infra #${deployment.infraId}`}
                                </p>
                                {metadata && (
                                  <p className="mt-1 text-xs text-slate-400">{metadata}</p>
                                )}
                              </div>
                              </div>
                              {deployment.dynamicParams && Object.keys(deployment.dynamicParams).length > 0 && (
                                <p className="mt-2 text-xs text-emerald-300/80 break-words">
                                  {Object.entries(deployment.dynamicParams)
                                    .map(([key, value]) => `${key}=${value}`)
                                  .join(", ")}
                              </p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Modal */}
      <AddDeploymentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setComponentForModal(null);
          setDeploymentsForModal(undefined);
        }}
        components={components}
        infrastructures={infrastructures}
        configuredEnvironments={configuredEnvironments}
        configuredRegions={configuredRegions}
        configuredProfiles={configuredProfiles}
        onRefresh={loadData}
        componentDefaultInfraType={modalComponentDefaults?.defaultInfraType}
        componentDefaultPort={modalComponentDefaults?.defaultPort ?? null}
        defaultComponentId={componentForModal}
        existingDeployments={deploymentsForModal}
      />
    </div>
  );
}
