import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ComponentFormData) => Promise<void>;
  projectId: number;
  projectName?: string;
}

export interface ComponentFormData {
  componentName: string;
  module?: string;
  description?: string;
  projectId: number;
  defaultInfraType?: string;
  defaultPort?: number;
  deployments?: Array<{
    infraId: number;
    profile: string;
    port?: number;
    dynamicParams?: Record<string, string>;
    environment?: string;
    region?: string;
  }>;
}

type ComponentFormState = {
  componentName: string;
  module: string;
  description: string;
  defaultInfraType: string;
  defaultPort: string;
};

const defaultState: ComponentFormState = {
  componentName: "",
  module: "",
  description: "",
  defaultInfraType: "",
  defaultPort: "",
};

export function AddServiceModal({ isOpen, onClose, onSave, projectId, projectName }: AddServiceModalProps) {
  const [formState, setFormState] = useState<ComponentFormState>(defaultState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormState(defaultState);
      setError(null);
    }
  }, [isOpen]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.currentTarget;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedName = formState.componentName.trim();
    if (!trimmedName) {
      setError("Component name is required.");
      return;
    }

    if (!Number.isFinite(projectId)) {
      setError("Unable to determine target project. Please re-select the project and try again.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload: ComponentFormData = {
      componentName: trimmedName,
      module: formState.module.trim() || undefined,
      description: formState.description.trim() || undefined,
      projectId,
      defaultInfraType: formState.defaultInfraType.trim() || undefined,
      defaultPort: formState.defaultPort.trim() ? Number(formState.defaultPort.trim()) : undefined,
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      console.error("Failed to create component:", err);
      const message = err instanceof Error ? err.message : "Failed to create service component";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between border-b border-slate-700 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/20 p-2">
              <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Add Service Component</h2>
              <p className="text-sm text-slate-400">
                Register a new service component so it appears in project dashboards and infrastructure mappings.
              </p>
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

          <div className="rounded-lg border border-slate-700/70 bg-slate-900/40 px-4 py-3 text-xs text-slate-400">
            Saving to <span className="font-semibold text-slate-200">{projectName ?? `Project #${projectId}`}</span> in
            the `ops_components` table.
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="componentName" className="block text-sm font-medium text-slate-300 mb-2">
                Component Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="componentName"
                name="componentName"
                type="text"
                required
                value={formState.componentName}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g., payment-service"
              />
            </div>

            <div>
              <label htmlFor="module" className="block text-sm font-medium text-slate-300 mb-2">
                Module / Domain
              </label>
              <input
                id="module"
                name="module"
                type="text"
                value={formState.module}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g., Core Trading"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formState.description}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Short summary of what this service component is responsible for."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="defaultInfraType" className="block text-sm font-medium text-slate-300 mb-2">
                  Hosted On <span className="text-rose-400">*</span>
                </label>
                <select
                  id="defaultInfraType"
                  name="defaultInfraType"
                  value={formState.defaultInfraType}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  required
                >
                  <option value="">Select hosted platform</option>
                  <option value="linux">linux</option>
                  <option value="windows">windows</option>
                  <option value="ecs">ecs</option>
                </select>
              </div>

              <div>
                <label htmlFor="defaultPort" className="block text-sm font-medium text-slate-300 mb-2">
                  Default Port <span className="text-rose-400">*</span>
                </label>
                <input
                  id="defaultPort"
                  name="defaultPort"
                  type="number"
                  min={1}
                  max={65535}
                  value={formState.defaultPort}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., 8080"
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-700/70 bg-slate-900/30 px-4 py-3 text-xs text-slate-400">
              Deployment mappings can be configured later from the Deployment Config screen once the component is saved.
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-700 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-70"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Component"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
