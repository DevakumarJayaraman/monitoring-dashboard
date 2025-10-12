import React, { useState, useEffect, useCallback } from 'react';
import TableGrid from '../shared/TableGrid';
import {
  fetchProjectEnvironments,
  fetchProjectRegions,
  fetchProjectMappings,
  saveProjectMapping,
  deleteProjectMapping,
  EnvironmentDTO,
  RegionDTO,
} from '../../services/api';

interface EnvironmentRegionMapping {
  id: string;
  perId?: number;
  environmentId: number;
  environmentCode: string;
  environmentName: string;
  regionId: number;
  regionCode: string;
  regionName: string;
  profileCodes: string;
  isSaved: boolean;
  isEditing?: boolean; // Add this flag for edit mode
}

interface EnvironmentRegionMappingsProps {
  onMappingsChange?: (mappings: EnvironmentRegionMapping[]) => void;
  projectId?: number; // Optional: for edit mode
  onShowToast?: (message: string, type: 'success' | 'error') => void;
}

const EnvironmentRegionMappings: React.FC<EnvironmentRegionMappingsProps> = ({
  onMappingsChange,
  projectId,
  onShowToast
}) => {
  const [mappings, setMappings] = useState<EnvironmentRegionMapping[]>([]);
  const [environments, setEnvironments] = useState<EnvironmentDTO[]>([]);
  const [regions, setRegions] = useState<RegionDTO[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadExistingMappings = useCallback(async (id: number) => {
    try {
      setLoading(true);
      const existingMappings = await fetchProjectMappings(id);

      // Transform API response to component state format
      const transformedMappings: EnvironmentRegionMapping[] = existingMappings.map(mapping => ({
        id: `existing-${mapping.perId}`,
        perId: mapping.perId,
        environmentId: mapping.environmentId,
        environmentCode: mapping.envCode,
        environmentName: mapping.envDesc,
        regionId: mapping.regionId,
        regionCode: mapping.regionCode,
        regionName: mapping.regionDesc,
        profileCodes: mapping.profileCodes.join(', '),
        isSaved: true, // Mark as already saved
      }));

      setMappings(transformedMappings);
      if (onMappingsChange) {
        onMappingsChange(transformedMappings);
      }
    } catch (error) {
      console.error('Failed to load existing mappings:', error);
    } finally {
      setLoading(false);
    }
  }, [onMappingsChange]);

  useEffect(() => {
    // Load existing mappings if in edit mode
    if (projectId && environments.length > 0 && regions.length > 0) {
      loadExistingMappings(projectId);
    }
  }, [projectId, environments, regions, loadExistingMappings]);

  const loadMetadata = async () => {
    try {
      setLoading(true);
      const [envData, regionData] = await Promise.all([
        fetchProjectEnvironments(),
        fetchProjectRegions()
      ]);
      setEnvironments(envData);
      setRegions(regionData);
    } catch (error) {
      console.error('Error loading metadata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMapping = () => {
    const newMapping: EnvironmentRegionMapping = {
      id: `temp-${Date.now()}`,
      environmentId: environments[0]?.envId || 0,
      environmentCode: environments[0]?.envCode || '',
      environmentName: environments[0]?.envDesc || '',
      regionId: regions[0]?.regionId || 0,
      regionCode: regions[0]?.regionCode || '',
      regionName: regions[0]?.regionDesc || '',
      profileCodes: '',
      isSaved: false,
    };
    const updatedMappings = [...mappings, newMapping];
    setMappings(updatedMappings);
    if (onMappingsChange) {
      onMappingsChange(updatedMappings);
    }
  };

  const handleEnvironmentChange = (id: string, environmentId: number) => {
    const env = environments.find(e => e.envId === environmentId);
    if (env) {
      const updatedMappings = mappings.map(m =>
        m.id === id
          ? { ...m, environmentId, environmentCode: env.envCode, environmentName: env.envDesc }
          : m
      );
      setMappings(updatedMappings);
      if (onMappingsChange) {
        onMappingsChange(updatedMappings);
      }
    }
  };

  const handleRegionChange = (id: string, regionId: number) => {
    const region = regions.find(r => r.regionId === regionId);
    if (region) {
      const updatedMappings = mappings.map(m =>
        m.id === id
          ? { ...m, regionId, regionCode: region.regionCode, regionName: region.regionDesc }
          : m
      );
      setMappings(updatedMappings);
      if (onMappingsChange) {
        onMappingsChange(updatedMappings);
      }
    }
  };

  const handleProfileCodesChange = (id: string, profileCodes: string) => {
    const updatedMappings = mappings.map(m =>
      m.id === id ? { ...m, profileCodes } : m
    );
    setMappings(updatedMappings);
    if (onMappingsChange) {
      onMappingsChange(updatedMappings);
    }
  };

  const handleEdit = (id: string) => {
    const updatedMappings = mappings.map(m =>
      m.id === id ? { ...m, isEditing: true } : m
    );
    setMappings(updatedMappings);
    if (onMappingsChange) {
      onMappingsChange(updatedMappings);
    }
  };

  const handleCancelEdit = (_id: string) => {
    // Reload the original data to cancel changes
    if (projectId) {
      loadExistingMappings(projectId);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!projectId) {
      if (onShowToast) {
        onShowToast('Cannot update mapping without a project ID.', 'error');
      }
      return;
    }

    const mappingToUpdate = mappings.find(m => m.id === id);
    if (mappingToUpdate && mappingToUpdate.perId) {
      try {
        await saveProjectMapping(projectId, {
          perId: mappingToUpdate.perId,
          environmentId: mappingToUpdate.environmentId,
          regionId: mappingToUpdate.regionId,
          profileCodes: mappingToUpdate.profileCodes.split(',').map(code => code.trim()).filter(code => code.length > 0),
        });

        // Mark as no longer editing
        const updatedMappings = mappings.map(m =>
          m.id === id ? { ...m, isEditing: false } : m
        );
        setMappings(updatedMappings);
        if (onMappingsChange) {
          onMappingsChange(updatedMappings);
        }
        if (onShowToast) {
          onShowToast(`Mapping ${mappingToUpdate.environmentCode}-${mappingToUpdate.regionCode} updated successfully!`, 'success');
        }
      } catch (error) {
        console.error('Error updating mapping:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error updating mapping. Please try again.';
        if (onShowToast) {
          onShowToast(errorMessage, 'error');
        }
      }
    }
  };

  const handleSave = async (id: string) => {
    if (!projectId) {
      if (onShowToast) {
        onShowToast('Cannot save mapping without a project ID. Please create the project first.', 'error');
      }
      return;
    }

    const mappingToSave = mappings.find(m => m.id === id);
    if (mappingToSave) {
      try {
        const savedMapping = await saveProjectMapping(projectId, {
          perId: mappingToSave.perId,
          environmentId: mappingToSave.environmentId,
          regionId: mappingToSave.regionId,
          profileCodes: mappingToSave.profileCodes.split(',').map(code => code.trim()).filter(code => code.length > 0),
        });

        // Update the mapping with the returned perId and mark as saved
        const updatedMappings = mappings.map(m =>
          m.id === id ? {
            ...m,
            perId: savedMapping.perId,
            id: `existing-${savedMapping.perId}`,
            isSaved: true
          } : m
        );
        setMappings(updatedMappings);
        if (onMappingsChange) {
          onMappingsChange(updatedMappings);
        }
        if (onShowToast) {
          onShowToast(`Mapping ${mappingToSave.environmentCode}-${mappingToSave.regionCode} saved successfully!`, 'success');
        }
      } catch (error) {
        console.error('Error saving mapping:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error saving mapping. Please try again.';
        if (onShowToast) {
          onShowToast(errorMessage, 'error');
        }
      }
    }
  };

  const handleDelete = async (id: string) => {
    const mappingToDelete = mappings.find(m => m.id === id);

    if (mappingToDelete && mappingToDelete.perId && projectId) {
      // If it's a saved mapping, delete from backend
      try {
        await deleteProjectMapping(projectId, mappingToDelete.perId);
        if (onShowToast) {
          onShowToast(`Mapping ${mappingToDelete.environmentCode}-${mappingToDelete.regionCode} deleted successfully!`, 'success');
        }
      } catch (error) {
        console.error('Error deleting mapping:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error deleting mapping. Please try again.';
        if (onShowToast) {
          onShowToast(errorMessage, 'error');
        }
        setShowDeleteConfirm(null);
        return;
      }
    }

    // Remove from local state
    const updatedMappings = mappings.filter(m => m.id !== id);
    setMappings(updatedMappings);
    setShowDeleteConfirm(null);
    if (onMappingsChange) {
      onMappingsChange(updatedMappings);
    }
  };

  const columns = [
    {
      header: 'Environment',
      accessor: 'environmentCode',
      Cell: ({ row }: { value: string; row: EnvironmentRegionMapping }) => {
        if (row.isSaved) {
          return <span className="text-slate-100 font-medium">{row.environmentCode}</span>;
        }
        return (
          <select
            value={row.environmentId}
            onChange={(e) => handleEnvironmentChange(row.id, Number(e.target.value))}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-sm transition-colors hover:border-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          >
            {environments.map(env => (
              <option key={env.envId} value={env.envId}>
                {env.envCode}
              </option>
            ))}
          </select>
        );
      }
    },
    {
      header: 'Region',
      accessor: 'regionCode',
      Cell: ({ row }: { value: string; row: EnvironmentRegionMapping }) => {
        if (row.isSaved) {
          return <span className="text-slate-100 font-medium">{row.regionCode}</span>;
        }
        return (
          <select
            value={row.regionId}
            onChange={(e) => handleRegionChange(row.id, Number(e.target.value))}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-sm transition-colors hover:border-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          >
            {regions.map(region => (
              <option key={region.regionId} value={region.regionId}>
                {region.regionCode}
              </option>
            ))}
          </select>
        );
      }
    },
    {
      header: 'Profile Codes',
      accessor: 'profileCodes',
      Cell: ({ row }: { value: string; row: EnvironmentRegionMapping }) => {
        if (row.isSaved && !row.isEditing) {
          return <span className="text-slate-100">{row.profileCodes || '-'}</span>;
        }
        return (
          <div>
            <input
              type="text"
              value={row.profileCodes}
              onChange={(e) => handleProfileCodesChange(row.id, e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 shadow-sm transition-colors hover:border-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              placeholder="e.g., apacqa, emeaqa, amerqa"
            />
            <p className="mt-1 text-xs text-slate-500">Comma-separated values</p>
          </div>
        );
      }
    }
  ];

  const renderActions = (row: EnvironmentRegionMapping) => {
    if (!row.isSaved) {
      return (
        <button
          onClick={() => handleSave(row.id)}
          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-medium transition"
        >
          Save
        </button>
      );
    }

    // If in edit mode, show Update and Cancel buttons
    if (row.isEditing) {
      return (
        <div className="flex gap-2 items-center">
          <button
            onClick={() => handleUpdate(row.id)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition"
            title="Update mapping"
          >
            Update
          </button>
          <button
            onClick={() => handleCancelEdit(row.id)}
            className="px-3 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-medium transition"
            title="Cancel editing"
          >
            Cancel
          </button>
        </div>
      );
    }

    // Normal saved state - show Edit and Delete buttons
    return (
      <div className="flex gap-2 items-center">
        {showDeleteConfirm === row.id ? (
          <div className="flex gap-2 items-center">
            <span className="text-sm text-slate-300">Delete?</span>
            <button
              onClick={() => handleDelete(row.id)}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition"
            >
              Yes
            </button>
            <button
              onClick={() => setShowDeleteConfirm(null)}
              className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-medium transition"
            >
              No
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => handleEdit(row.id)}
              className="text-blue-400 hover:text-blue-300 transition"
              title="Edit profile codes"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(row.id)}
              className="text-red-400 hover:text-red-300 transition"
              title="Delete mapping"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-400">Loading environments and regions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-4 text-lg font-semibold text-slate-200">Environment & Region Mappings</h3>

        {mappings.length > 0 ? (
          <TableGrid
            columns={columns}
            data={mappings}
            actions={renderActions}
          />
        ) : (
          <div className="text-center py-8 text-slate-400 bg-slate-900/50 rounded-lg border border-slate-700">
            No mappings added yet. Click "Add Mapping" to create one.
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleAddMapping}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
            disabled={environments.length === 0 || regions.length === 0}
          >
            + Add Mapping
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentRegionMappings;
