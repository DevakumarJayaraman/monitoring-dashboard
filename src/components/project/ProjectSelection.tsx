import type { JSX } from "react";
import { useState, useEffect } from "react";
import type { Project } from "../../types/project";
import { fetchAllProjects, type ApiProject } from "../../services/api";
import { Header } from "../layout/Header";
import { Footer } from "../layout/Footer";
import { useTheme } from "../../context/ThemeContext";

interface ProjectSelectionProps {
  onProjectSelect: (project: Project) => void;
}

export function ProjectSelection({ onProjectSelect }: ProjectSelectionProps): JSX.Element {
  const { theme } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Theme-aware class builders
  const getCardGradient = () => {
    return theme === "light"
      ? "bg-gradient-to-br from-white via-gray-50/95 to-gray-100 border-gray-200"
      : "bg-gradient-to-br from-slate-800 via-slate-800/95 to-slate-900 border-slate-700";
  };

  const getCardShadow = () => {
    return theme === "light"
      ? "shadow-md hover:shadow-xl hover:shadow-emerald-500/10"
      : "shadow-lg hover:shadow-2xl hover:shadow-emerald-500/20";
  };

  const getEnvGradientDivider = () => {
    return theme === "light"
      ? "bg-gradient-to-r from-gray-300 to-transparent"
      : "bg-gradient-to-r from-slate-700 to-transparent";
  };

  // Load projects from backend
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const apiProjects = await fetchAllProjects();
        
        // Convert API projects to frontend format
        const convertedProjects: Project[] = apiProjects.map((api: ApiProject) => ({
          id: api.id.toString(),
          name: api.name,
          description: api.description || '',
          totalServices: api.totalServices || 0,
          totalInfrastructure: api.totalInfrastructure || 0,
          healthStatus: api.healthStatus || 'healthy',
          lastUpdated: api.lastUpdated || new Date().toISOString(),
          infrastructureByEnv: api.infrastructureByEnv || {},
        }));
        
        setProjects(convertedProjects);
      } catch (err) {
        console.error('Failed to load projects:', err);
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProjects();
  }, []);

  return (
    <div className={`flex flex-col h-screen ${theme === "light" ? "bg-gray-50" : "bg-slate-900"}`}>
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 shadow-lg shadow-emerald-500/20">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-100">
                Projects
              </h1>
              <p className="text-sm text-slate-400">
                Select a project to view infrastructure and services
              </p>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-5">
          <p className="text-sm text-slate-400">
            <span className="font-semibold text-emerald-400">{projects.length}</span> {projects.length === 1 ? 'project' : 'projects'} available
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-16 text-center">
            <div className="relative mx-auto mb-6 h-16 w-16">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-400"></div>
              <div className="absolute inset-2 animate-pulse rounded-full bg-emerald-500/10"></div>
            </div>
            <p className="text-xl font-semibold text-slate-200">Loading projects...</p>
            <p className="mt-2 text-sm text-slate-500">Please wait while we fetch your projects</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="rounded-2xl border border-red-500/50 bg-gradient-to-br from-red-500/10 to-red-500/5 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <svg
                className="h-8 w-8 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-xl font-semibold text-red-300">Failed to Load Projects</p>
            <p className="mt-2 text-sm text-red-400/80">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-lg bg-red-500/20 px-6 py-2.5 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/30"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && projects.length === 0 && (
          <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-700/50">
              <svg
                className="h-10 w-10 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-xl font-semibold text-slate-300">No projects found</p>
            <p className="mt-2 text-sm text-slate-500">
              No projects available at the moment
            </p>
          </div>
        )}

        {/* Project Grid */}
        {!isLoading && !error && projects.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => onProjectSelect(project)}
                className={`group relative cursor-pointer overflow-hidden rounded-xl border p-6 transition-all duration-300 hover:scale-[1.02] hover:border-emerald-500/50 ${getCardGradient()} ${getCardShadow()}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onProjectSelect(project);
                  }
                }}
              >
                {/* Decorative gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 transition-all duration-300 group-hover:from-emerald-500/5 group-hover:to-transparent" />
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Header with Project Name */}
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-slate-100 group-hover:text-emerald-400 transition-colors truncate mb-2">
                        {project.name}
                      </h3>
                      <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0 rounded-lg bg-slate-700/30 p-2 transition-colors group-hover:bg-emerald-500/10">
                      <svg
                        className="h-5 w-5 text-slate-500 transition-colors group-hover:text-emerald-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Summary Stats Bar */}
                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-slate-900/60 border border-slate-700/50 p-3 backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="rounded bg-emerald-500/10 p-1">
                          <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-slate-400">Infrastructure</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-100">{project.totalInfrastructure}</p>
                    </div>
                    <div className="rounded-lg bg-slate-900/60 border border-slate-700/50 p-3 backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="rounded bg-blue-500/10 p-1">
                          <svg className="h-4 w-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-slate-400">Services</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-100">{project.totalServices}</p>
                    </div>
                  </div>

                  {/* Infrastructure Breakdown by Environment */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`h-px flex-1 ${getEnvGradientDivider()}`} />
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Environments</span>
                      <div className={`h-px flex-1 bg-gradient-to-l ${theme === "light" ? "from-gray-300" : "from-slate-700"} to-transparent`} />
                    </div>
                    
                    {Object.entries(project.infrastructureByEnv)
                      .sort(([a], [b]) => {
                        const order: Record<string, number> = { 'DEV': 1, 'UAT': 2, 'PROD': 3, 'COB': 4 };
                        return (order[a] || 99) - (order[b] || 99);
                      })
                      .map(([env, types]) => {
                        const total = Object.values(types).reduce((sum, count) => sum + count, 0);
                        const getEnvColor = (environment: string) => {
                          switch (environment) {
                            case 'PROD': return 'from-amber-500/20 to-amber-500/5 border-amber-500/30';
                            case 'UAT': return 'from-blue-500/20 to-blue-500/5 border-blue-500/30';
                            case 'DEV': return 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30';
                            case 'COB': return 'from-violet-500/20 to-violet-500/5 border-violet-500/30';
                            default: return 'from-slate-500/20 to-slate-500/5 border-slate-500/30';
                          }
                        };
                        
                        return (
                          <div key={env} className={`rounded-lg border bg-gradient-to-r p-3 ${getEnvColor(env)}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-slate-200">{env}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-400">Total:</span>
                                <span className="rounded-full bg-slate-900/50 px-2 py-0.5 text-xs font-bold text-emerald-400">{total}</span>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              {Object.entries(types).map(([type, count]) => (
                                <span
                                  key={type}
                                  className="inline-flex items-center gap-1.5 rounded-md bg-slate-900/70 px-2.5 py-1 text-xs font-medium backdrop-blur-sm"
                                >
                                  <span className="capitalize text-slate-300">{type}</span>
                                  <span className="text-slate-600">•</span>
                                  <span className="font-bold text-slate-100">{count}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
