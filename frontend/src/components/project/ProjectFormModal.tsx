import type { JSX } from "react";
import { useState, useEffect } from "react";
import type { Project } from "../../types/project.ts";
import { 
  createProject, 
  updateProject, 
  type ProjectCreateDTO
} from "../../services/api.ts";
import { useTheme } from "../../context/ThemeContext.tsx";
import EnvironmentRegionMappings from "./EnvironmentRegionMappings";

interface ProjectFormModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export function ProjectFormModal({ isOpen, project, onClose, onShowToast }: ProjectFormModalProps): JSX.Element | null {
  const { theme } = useTheme();
  const isEditMode = !!project;
  
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    activeFlag: true,
  });

  const [isSavingBasicInfo, setIsSavingBasicInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(project?.id);

  // Load project data for editing
  useEffect(() => {
    if (isOpen && project) {
      setFormData({
        projectName: project.name,
        description: project.description,
        activeFlag: true,
      });
      setCurrentProjectId(project.id);
    } else if (isOpen && !project) {
      // Reset form for new project
      setFormData({
        projectName: '',
        description: '',
        activeFlag: true,
      });
      setCurrentProjectId(undefined);
    }
  }, [isOpen, project]);

  const handleChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveBasicInfo = async () => {
    setError(null);
    setIsSavingBasicInfo(true);

    try {
      const projectData: ProjectCreateDTO = {
        projectName: formData.projectName,
        description: formData.description,
        activeFlag: formData.activeFlag,
        environmentMappings: [] // Empty array for basic info save
      };

      if (isEditMode && currentProjectId) {
        // Update existing project (only name and description)
        await updateProject(Number(currentProjectId), projectData);
        onShowToast(`Project "${formData.projectName}" updated successfully!`, 'success');
      } else {
        // Create new project
        const createdProject = await createProject(projectData);
        // The backend returns a Project entity with projectId field (Long) or id field
        const projectId = ('projectId' in createdProject ? createdProject.projectId : createdProject.id) as number;
        setCurrentProjectId(String(projectId));
        onShowToast(`Project "${formData.projectName}" created successfully! You can now add environment mappings.`, 'success');
      }
    } catch (err) {
      console.error('Failed to save project basic info:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save project';
      setError(errorMessage);
      onShowToast(errorMessage, 'error');
    } finally {
      setIsSavingBasicInfo(false);
    }
  };

  if (!isOpen) return null;

  // Theme-aware class builders
  const getModalBg = () => {
    return theme === "light"
      ? "bg-gradient-to-br from-white to-gray-50 border-gray-300"
      : "bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700";
  };

  const getHeaderBg = () => {
    return theme === "light"
      ? "bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300"
      : "bg-gradient-to-r from-slate-800 to-slate-900 border-slate-600";
  };

  const getInputBg = () => {
    return theme === "light"
      ? "border-gray-300 bg-white text-gray-900 hover:border-gray-400 focus:border-emerald-500"
      : "border-slate-600 bg-slate-900 text-slate-100 hover:border-slate-500 focus:border-emerald-400";
  };

  const getTextColor = () => {
    return theme === "light" ? "text-gray-900" : "text-slate-100";
  };

  const getLabelColor = () => {
    return theme === "light" ? "text-gray-700" : "text-slate-300";
  };

  const getButtonBg = () => {
    return theme === "light"
      ? "border-gray-300 bg-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-300"
      : "border-slate-600 bg-slate-700 text-slate-200 hover:border-slate-500 hover:bg-slate-600";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-4xl">
        {/* Header */}
        <div className={`rounded-t-xl border-b px-6 py-4 ${getHeaderBg()}`}>
          <h2 className={`text-2xl font-bold ${getTextColor()}`}>
            {isEditMode ? 'Edit Project' : 'Add Project'}
          </h2>
          <p className={`mt-1 text-sm ${theme === "light" ? "text-gray-600" : "text-slate-400"}`}>
            {isEditMode ? 'Update project details and environment mappings' : 'Create a new project with environment and region mappings'}
          </p>
        </div>

        <div className={`rounded-b-xl border border-t-0 ${getModalBg()}`}>
          {/* Form Content */}
          <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Basic Information */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${getTextColor()}`}>Basic Information</h3>
                <button
                  type="button"
                  onClick={handleSaveBasicInfo}
                  disabled={isSavingBasicInfo || !formData.projectName}
                  className="rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-emerald-700 hover:to-green-700 hover:shadow-lg disabled:opacity-50"
                >
                  {isSavingBasicInfo ? (
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
              <div className="grid gap-4 md:grid-cols-2">
                {/* Project Name */}
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${getLabelColor()}`}>
                    Project Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) => handleChange('projectName', e.target.value)}
                    required
                    className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400/40 ${getInputBg()}`}
                    placeholder="e.g., Event Streaming Platform"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${getLabelColor()}`}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                    className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400/40 ${getInputBg()}`}
                    placeholder="Brief description of the project"
                  />
                </div>
              </div>

              {!isEditMode && !currentProjectId && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-500/10 border border-blue-500/30 p-3">
                  <svg className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-blue-300">
                    Click "Create Project" to save the basic information first, then you can add environment/region mappings below.
                  </p>
                </div>
              )}
            </div>

            {/* Environment/Region Mappings */}
            {(isEditMode || currentProjectId) && (
              <div>
                <EnvironmentRegionMappings
                  projectId={currentProjectId ? Number(currentProjectId) : undefined}
                  onShowToast={onShowToast}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`border-t px-6 py-4 ${theme === "light" ? "border-gray-300" : "border-slate-600"}`}>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${getButtonBg()}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
