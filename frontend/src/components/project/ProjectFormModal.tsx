import type { JSX } from "react";
import { useState, useEffect, FormEvent } from "react";
import type { Project } from "../../types/project.ts";
import { 
  createProject, 
  updateProject, 
  fetchProjectEnvironments, 
  fetchProjectRegions,
  type EnvironmentDTO,
  type RegionDTO,
  type ProjectCreateDTO,
  type ProjectEnvironmentMappingDTO
} from "../../services/api.ts";

interface ProjectFormModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onSuccess: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

interface FormMapping {
  id: string;
  environmentId: number | null;
  regionId: number | null;
  profileCodes: string;
}

export function ProjectFormModal({ isOpen, project, onClose, onSuccess, onShowToast }: ProjectFormModalProps): JSX.Element | null {
  const isEditMode = !!project;
  
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    activeFlag: true,
  });

  const [mappings, setMappings] = useState<FormMapping[]>([
    { id: crypto.randomUUID(), environmentId: null, regionId: null, profileCodes: '' }
  ]);

  const [environments, setEnvironments] = useState<EnvironmentDTO[]>([]);
  const [regions, setRegions] = useState<RegionDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load environments and regions
  useEffect(() => {
    if (isOpen) {
      loadMetadata();
    }
  }, [isOpen]);

  // Load project data for editing
  useEffect(() => {
    if (isOpen && project) {
      setFormData({
        projectName: project.name,
        description: project.description,
        activeFlag: true,
      });
      // For edit mode, you would load existing mappings from project data
      // This is simplified - you'd need to fetch full project details with mappings
    } else if (isOpen && !project) {
      // Reset form for new project
      setFormData({
        projectName: '',
        description: '',
        activeFlag: true,
      });
      setMappings([
        { id: crypto.randomUUID(), environmentId: null, regionId: null, profileCodes: '' }
      ]);
    }
  }, [isOpen, project]);

  const loadMetadata = async () => {
    setIsFetchingMetadata(true);
    try {
      const [envs, regs] = await Promise.all([
        fetchProjectEnvironments(),
        fetchProjectRegions()
      ]);
      setEnvironments(envs);
      setRegions(regs);
    } catch (err) {
      console.error('Failed to load metadata:', err);
      setError('Failed to load environments and regions');
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addMapping = () => {
    setMappings(prev => [
      ...prev,
      { id: crypto.randomUUID(), environmentId: null, regionId: null, profileCodes: '' }
    ]);
  };

  const removeMapping = (id: string) => {
    setMappings(prev => prev.filter(m => m.id !== id));
  };

  const updateMapping = (id: string, field: keyof FormMapping, value: number | string | null) => {
    setMappings(prev => prev.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validate mappings
    const validMappings = mappings.filter(m => m.environmentId && m.regionId);
    
    if (validMappings.length === 0) {
      setError('Please add at least one environment/region mapping');
      return;
    }

    setIsLoading(true);

    try {
      const projectData: ProjectCreateDTO = {
        projectName: formData.projectName,
        description: formData.description,
        activeFlag: formData.activeFlag,
        environmentMappings: validMappings.map(m => ({
          environmentId: m.environmentId!,
          regionId: m.regionId!,
          profileCodes: m.profileCodes
            .split(',')
            .map(p => p.trim())
            .filter(p => p.length > 0)
        }))
      };

      console.log('Submitting project:', projectData);

      if (isEditMode) {
        await updateProject(Number(project.id), projectData);
        console.log('Project updated successfully');
        onShowToast(`Project "${formData.projectName}" updated successfully!`, 'success');
      } else {
        await createProject(projectData);
        console.log('Project created successfully');
        onShowToast(`Project "${formData.projectName}" created successfully!`, 'success');
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save project:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save project';
      setError(errorMessage);
      onShowToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-4xl">
        {/* Header */}
        <div className="rounded-t-xl border-b border-slate-600 bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
          <h2 className="text-2xl font-bold text-slate-100">
            {isEditMode ? 'Edit Project' : 'Add Project'}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {isEditMode ? 'Update project details and environment mappings' : 'Create a new project with environment and region mappings'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-b-xl border border-t-0 border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900">
          {/* Form Content */}
          <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {isFetchingMetadata && (
              <div className="mb-4 rounded-lg border border-blue-500/50 bg-blue-500/10 p-3 text-sm text-blue-400">
                Loading environments and regions...
              </div>
            )}

            {/* Basic Information */}
            <div className="mb-6">
              <h3 className="mb-4 text-lg font-semibold text-slate-200">Basic Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Project Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Project Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) => handleChange('projectName', e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-sm transition-colors hover:border-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                    placeholder="e.g., Trade Management System"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-sm transition-colors hover:border-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                    placeholder="Brief description of the project"
                  />
                </div>
              </div>
            </div>

            {/* Environment/Region Mappings */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-200">Environment & Region Mappings</h3>
                <button
                  type="button"
                  onClick={addMapping}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700"
                >
                  + Add Mapping
                </button>
              </div>

              <div className="space-y-4">
                {mappings.map((mapping, index) => (
                  <div key={mapping.id} className="rounded-lg border border-slate-600 bg-slate-900/50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-400">Mapping #{index + 1}</span>
                      {mappings.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMapping(mapping.id)}
                          className="text-sm text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      {/* Environment */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Environment <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={mapping.environmentId || ''}
                          onChange={(e) => updateMapping(mapping.id, 'environmentId', e.target.value ? Number(e.target.value) : null)}
                          required
                          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-sm transition-colors hover:border-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                        >
                          <option value="">Select environment</option>
                          {environments.map(env => (
                            <option key={env.envId} value={env.envId}>
                              {env.envCode} - {env.envDesc}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Region */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Region <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={mapping.regionId || ''}
                          onChange={(e) => updateMapping(mapping.id, 'regionId', e.target.value ? Number(e.target.value) : null)}
                          required
                          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-sm transition-colors hover:border-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                        >
                          <option value="">Select region</option>
                          {regions.map(region => (
                            <option key={region.regionId} value={region.regionId}>
                              {region.regionCode} - {region.regionDesc}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Profile Codes */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Profile Codes
                        </label>
                        <input
                          type="text"
                          value={mapping.profileCodes}
                          onChange={(e) => updateMapping(mapping.id, 'profileCodes', e.target.value)}
                          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-sm transition-colors hover:border-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                          placeholder="e.g., apacqa, emeaqa"
                        />
                        <p className="mt-1 text-xs text-slate-500">Comma-separated profile codes</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  <span>{isEditMode ? 'Update Project' : 'Create Project'}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
