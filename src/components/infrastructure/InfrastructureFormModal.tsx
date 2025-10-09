import { useState, useEffect, type JSX, type FormEvent } from "react";
import type { InfraDetail } from "../../types/infrastructure";
import { 
  createInfrastructure, 
  updateInfrastructure, 
  fetchDistinctEnvironments,
  fetchDistinctRegions,
  type InfrastructureCreateDTO 
} from "../../services/api";

interface InfrastructureFormModalProps {
  isOpen: boolean;
  machine: InfraDetail | null; // null for create, InfraDetail for edit
  projectId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function InfrastructureFormModal({
  isOpen,
  machine,
  projectId,
  onClose,
  onSuccess,
}: InfrastructureFormModalProps): JSX.Element | null {
  const [formData, setFormData] = useState<InfrastructureCreateDTO>({
    infraType: 'linux',
    hostname: '',
    environment: 'DEV',
    region: 'APAC',
    datacenter: '',
    projectId: projectId,
  });

  const [environments, setEnvironments] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = machine !== null;

  // Fetch distinct environments and regions
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setIsFetchingMetadata(true);
        const [envs, regs] = await Promise.all([
          fetchDistinctEnvironments(),
          fetchDistinctRegions(),
        ]);
        
        // Add default values if lists are empty
        setEnvironments(envs.length > 0 ? envs : ['DEV', 'UAT', 'STAGING', 'PROD', 'COB']);
        setRegions(regs.length > 0 ? regs : ['APAC', 'NAM', 'EMEA']);
      } catch (err) {
        console.error('Failed to load metadata:', err);
        // Use defaults if fetch fails
        setEnvironments(['DEV', 'UAT', 'STAGING', 'PROD', 'COB']);
        setRegions(['APAC', 'NAM', 'EMEA']);
      } finally {
        setIsFetchingMetadata(false);
      }
    };

    if (isOpen) {
      loadMetadata();
    }
  }, [isOpen]);

  // Initialize form data when modal opens or machine changes
  useEffect(() => {
    if (isOpen && machine) {
      // Edit mode - populate with existing data
      setFormData({
        infraType: machine.infraType,
        hostname: machine.machineName,
        environment: machine.environment,
        region: machine.region || 'APAC',
        datacenter: machine.datacenter || '',
        projectId: machine.projectId || projectId,
      });
    } else if (isOpen) {
      // Create mode - reset to defaults
      setFormData({
        infraType: 'linux',
        hostname: '',
        environment: 'DEV',
        region: 'APAC',
        datacenter: '',
        projectId: projectId,
      });
    }
    setError(null);
  }, [isOpen, machine, projectId]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isEditMode && machine) {
        console.log('Updating infrastructure:', formData);
        await updateInfrastructure(parseInt(machine.id), formData);
      } else {
        console.log('Creating new infrastructure:', formData);
        await createInfrastructure(formData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving infrastructure:', err);
      setError(err instanceof Error ? err.message : 'Failed to save infrastructure');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof InfrastructureCreateDTO, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-800 shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-100">
              {isEditMode ? 'Edit Infrastructure' : 'Add New Infrastructure'}
            </h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-700 hover:text-slate-200"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          {error && (
            <div className="mb-4 rounded-lg border border-rose-500/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hostname */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Hostname <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.hostname}
                onChange={(e) => handleChange('hostname', e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-sm transition-colors hover:border-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                placeholder="e.g., web-server-01"
              />
            </div>

            {/* Infrastructure Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Infrastructure Type <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={formData.infraType}
                onChange={(e) => handleChange('infraType', e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-sm transition-colors hover:border-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              >
                <option value="linux">Linux</option>
                <option value="windows">Windows</option>
                <option value="ecs">ECS</option>
              </select>
            </div>

            {/* Environment */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Environment <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={formData.environment}
                onChange={(e) => handleChange('environment', e.target.value)}
                disabled={isFetchingMetadata}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-sm transition-colors hover:border-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 disabled:opacity-50"
              >
                {isFetchingMetadata ? (
                  <option>Loading...</option>
                ) : (
                  environments.map(env => (
                    <option key={env} value={env}>{env}</option>
                  ))
                )}
              </select>
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Region
              </label>
              <select
                value={formData.region}
                onChange={(e) => handleChange('region', e.target.value)}
                disabled={isFetchingMetadata}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-sm transition-colors hover:border-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 disabled:opacity-50"
              >
                {isFetchingMetadata ? (
                  <option>Loading...</option>
                ) : (
                  regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))
                )}
              </select>
            </div>

            {/* Datacenter */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Datacenter
              </label>
              <input
                type="text"
                value={formData.datacenter}
                onChange={(e) => handleChange('datacenter', e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-sm transition-colors hover:border-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                placeholder="e.g., ap-southeast-1a"
              />
            </div>
          </div>

          {/* Footer - Inside Form */}
          <div className="border-t border-slate-600 px-6 py-4 -mx-6 -mb-4 mt-4">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || isFetchingMetadata}
                className="rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-emerald-700 hover:to-green-700 hover:shadow-lg disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEditMode ? 'Updating...' : 'Adding...'}
                  </span>
                ) : (
                  <span>{isEditMode ? 'Update' : 'Add'}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
