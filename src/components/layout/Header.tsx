import { useTheme } from "../../context/ThemeContext";
import type { Project } from "../../types/project";

interface HeaderProps {
  selectedProject?: Project | null;
  onBackToProjects?: () => void;
}

export function Header({ selectedProject, onBackToProjects }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/95 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        {/* Back Button */}
        {selectedProject && onBackToProjects && (
          <button
            onClick={onBackToProjects}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-300 transition-all hover:border-emerald-400 hover:text-emerald-400"
            title="Back to Projects"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Projects</span>
          </button>
        )}
        
        {/* Application Title */}
        <div>
          <h1 className="text-lg font-semibold text-slate-100">
            Application Control & Monitoring
          </h1>
          {selectedProject && (
            <p className="text-xs text-slate-400">
              {selectedProject.name} <span className="text-slate-600">•</span> {Object.keys(selectedProject.infrastructureByEnv).length} environments
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-slate-400 transition-all duration-200 hover:bg-slate-800 hover:text-slate-200 hover:scale-105"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* User Avatar */}
        <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-emerald-400 hover:scale-105">
          <span className="text-sm font-medium text-emerald-950">A</span>
        </div>
      </div>
    </header>
  );
}