import type { InfraDetail } from "../../types/infrastructure.ts";

type HousekeepingInfo = {
  machineName: string;
  infraType: string;
  tempFiles: { count: number; size: string; files: string[] };
  logFiles: { count: number; size: string; oldestDays: number; files: string[] };
  cacheFiles: { count: number; size: string; files: string[] };
  dockerImages: { count: number; size: string; files: string[] };
  estimatedCleanupSize: string;
  riskLevel: 'low' | 'medium' | 'high';
  fileSystemBefore: { mount: string; used: number; total: number; usedPercent: number }[];
  fileSystemAfter: { mount: string; used: number; total: number; usedPercent: number }[];
};

type HousekeepingStep = 'initial' | 'running' | 'completed';

interface HousekeepingModalProps {
  isOpen: boolean;
  machine: InfraDetail | null;
  info: HousekeepingInfo | null;
  isLoading: boolean;
  step: HousekeepingStep;
  onConfirm: () => void;
  onCancel: () => void;
}

export function HousekeepingModal({
  isOpen,
  machine,
  info,
  isLoading,
  step,
  onConfirm,
  onCancel,
}: HousekeepingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-3xl rounded-xl border border-slate-600 bg-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="border-b border-slate-600 px-6 py-4 sticky top-0 bg-slate-800 z-10">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/20 p-2">
              <svg className="h-6 w-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">
                {step === 'initial' && 'Run Housekeeping Script'}
                {step === 'running' && 'Running Housekeeping...'}
                {step === 'completed' && 'Housekeeping Completed'}
              </h3>
              <p className="text-sm text-slate-400">
                {machine?.machineName} ({machine?.infraType.toUpperCase()})
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          {/* Initial Step: Show analysis */}
          {step === 'initial' && (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent"></div>
                    <span className="text-slate-300">Analyzing cleanup opportunities...</span>
                  </div>
                </div>
              ) : info ? (
                <div className="space-y-4">
                  {/* Risk Level Indicator */}
                  <div className={`rounded-lg border px-4 py-3 ${
                    info.riskLevel === 'high' 
                      ? 'border-red-500/50 bg-red-500/10' 
                      : info.riskLevel === 'medium'
                      ? 'border-yellow-500/50 bg-yellow-500/10'
                      : 'border-green-500/50 bg-green-500/10'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${
                        info.riskLevel === 'high' 
                          ? 'text-red-200' 
                          : info.riskLevel === 'medium'
                          ? 'text-yellow-200'
                          : 'text-green-200'
                      }`}>
                        Risk Level: {info.riskLevel.toUpperCase()}
                      </span>
                      <span className={`text-xs font-semibold ${
                        info.riskLevel === 'high' 
                          ? 'text-red-300' 
                          : info.riskLevel === 'medium'
                          ? 'text-yellow-300'
                          : 'text-green-300'
                      }`}>
                        Estimated cleanup: {info.estimatedCleanupSize}
                      </span>
                    </div>
                  </div>

                  {/* Cleanup Details */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-200">Files to be cleaned:</h4>
                    
                    <div className="grid gap-3 sm:grid-cols-2">
                      {info.tempFiles.count > 0 && (
                        <div className="rounded-lg border border-slate-600 bg-slate-700/50 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-200">Temporary Files</span>
                            <span className="text-xs font-semibold text-amber-400">{info.tempFiles.size}</span>
                          </div>
                          <span className="text-xs text-slate-400">{info.tempFiles.count} files</span>
                        </div>
                      )}

                      {info.logFiles.count > 0 && (
                        <div className="rounded-lg border border-slate-600 bg-slate-700/50 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-200">Log Files</span>
                            <span className="text-xs font-semibold text-amber-400">{info.logFiles.size}</span>
                          </div>
                          <span className="text-xs text-slate-400">
                            {info.logFiles.count} files (oldest: {info.logFiles.oldestDays} days)
                          </span>
                        </div>
                      )}

                      {info.cacheFiles.count > 0 && (
                        <div className="rounded-lg border border-slate-600 bg-slate-700/50 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-200">Cache Files</span>
                            <span className="text-xs font-semibold text-amber-400">{info.cacheFiles.size}</span>
                          </div>
                          <span className="text-xs text-slate-400">{info.cacheFiles.count} files</span>
                        </div>
                      )}

                      {info.dockerImages.count > 0 && (
                        <div className="rounded-lg border border-slate-600 bg-slate-700/50 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-200">Docker Images</span>
                            <span className="text-xs font-semibold text-amber-400">{info.dockerImages.size}</span>
                          </div>
                          <span className="text-xs text-slate-400">{info.dockerImages.count} unused images</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Warning Message */}
                  {info.riskLevel === 'high' && (
                    <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
                      <div className="flex gap-3">
                        <svg className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-red-200">High Risk Operation</p>
                          <p className="text-xs text-red-300 mt-1">
                            This cleanup involves recent files or a large amount of data. Please ensure critical services are not affected.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}

          {/* Running Step: Show script output */}
          {step === 'running' && info && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-600 bg-slate-900/50 p-4 font-mono text-xs">
                <div className="space-y-1 text-slate-300">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400">$</span>
                    <span>Running housekeeping script...</span>
                  </div>
                  <div className="pl-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent"></div>
                      <span className="text-amber-400">Cleaning temporary files ({info.tempFiles.count} files)...</span>
                    </div>
                    {info.tempFiles.files.slice(0, 3).map((file, idx) => (
                      <div key={idx} className="pl-6 text-slate-400">→ Removing: {file}</div>
                    ))}
                    {info.tempFiles.files.length > 3 && (
                      <div className="pl-6 text-slate-500">... and {info.tempFiles.files.length - 3} more</div>
                    )}
                  </div>
                  <div className="pl-4 space-y-1 mt-2">
                    <div className="text-amber-400">Cleaning log files ({info.logFiles.count} files)...</div>
                    {info.logFiles.files.slice(0, 3).map((file, idx) => (
                      <div key={idx} className="pl-6 text-slate-400">→ Removing: {file}</div>
                    ))}
                  </div>
                  <div className="pl-4 space-y-1 mt-2">
                    <div className="text-amber-400">Cleaning cache files ({info.cacheFiles.count} files)...</div>
                    {info.cacheFiles.files.slice(0, 2).map((file, idx) => (
                      <div key={idx} className="pl-6 text-slate-400">→ Removing: {file}</div>
                    ))}
                  </div>
                  {info.dockerImages.count > 0 && (
                    <div className="pl-4 space-y-1 mt-2">
                      <div className="text-amber-400">Removing unused Docker images ({info.dockerImages.count} images)...</div>
                      {info.dockerImages.files.slice(0, 2).map((image, idx) => (
                        <div key={idx} className="pl-6 text-slate-400">→ Removing: {image}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-amber-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent"></div>
                <span>Please wait while housekeeping is in progress...</span>
              </div>
            </div>
          )}

          {/* Completed Step: Show results */}
          {step === 'completed' && info && (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-3">
                  <svg className="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-emerald-200">Housekeeping Completed Successfully</p>
                    <p className="text-xs text-emerald-300 mt-0.5">
                      Total space reclaimed: {info.estimatedCleanupSize}
                    </p>
                  </div>
                </div>
              </div>

              {/* File System Before/After */}
              <div className="space-y-3">
                <h4 className="font-medium text-slate-200 flex items-center gap-2">
                  <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  File System Space Comparison
                </h4>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Before */}
                  <div className="rounded-lg border border-slate-600 bg-slate-700/30 p-4">
                    <h5 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                      <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-300">Before</span>
                    </h5>
                    <div className="space-y-3">
                      {info.fileSystemBefore.map((vol, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-300">{vol.mount}</span>
                            <span className="text-slate-400">{vol.used} / {vol.total} GB</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-600">
                            <div 
                              className={`h-full rounded-full ${vol.usedPercent >= 90 ? 'bg-rose-500' : vol.usedPercent >= 75 ? 'bg-amber-500' : 'bg-sky-400'}`}
                              style={{ width: `${vol.usedPercent}%` }}
                            />
                          </div>
                          <div className="text-xs text-slate-400">{vol.usedPercent}% used</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* After */}
                  <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4">
                    <h5 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300">After</span>
                    </h5>
                    <div className="space-y-3">
                      {info.fileSystemAfter.map((vol, idx) => {
                        const before = info.fileSystemBefore[idx];
                        const saved = before.used - vol.used;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-emerald-200">{vol.mount}</span>
                              <span className="text-emerald-300">{vol.used} / {vol.total} GB</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-600">
                              <div 
                                className="h-full rounded-full bg-emerald-400"
                                style={{ width: `${vol.usedPercent}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-emerald-300">{vol.usedPercent}% used</span>
                              <span className="font-semibold text-emerald-400">↓ {saved.toFixed(1)} GB freed</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-lg border border-slate-600 bg-slate-700/30 p-4">
                <h5 className="text-sm font-semibold text-slate-200 mb-3">Cleanup Summary</h5>
                <div className="grid gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Temporary files removed:</span>
                    <span className="font-medium text-slate-200">{info.tempFiles.count} ({info.tempFiles.size})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Log files removed:</span>
                    <span className="font-medium text-slate-200">{info.logFiles.count} ({info.logFiles.size})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cache files removed:</span>
                    <span className="font-medium text-slate-200">{info.cacheFiles.count} ({info.cacheFiles.size})</span>
                  </div>
                  {info.dockerImages.count > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Docker images removed:</span>
                      <span className="font-medium text-slate-200">{info.dockerImages.count} ({info.dockerImages.size})</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-600 pt-2 mt-2">
                    <span className="text-slate-300 font-semibold">Total space reclaimed:</span>
                    <span className="font-bold text-emerald-400">{info.estimatedCleanupSize}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-600 px-6 py-4 sticky bottom-0 bg-slate-800">
          <div className="flex justify-end gap-3">
            {step === 'initial' && (
              <>
                <button
                  onClick={onCancel}
                  className="rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold shadow-md transition ${
                    isLoading
                      ? 'cursor-not-allowed bg-slate-600 text-slate-400'
                      : info?.riskLevel === 'high'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 hover:shadow-lg'
                      : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 hover:shadow-lg'
                  }`}
                >
                  {isLoading ? 'Analyzing...' : 'Run Cleanup'}
                </button>
              </>
            )}
            {step === 'running' && (
              <button
                disabled
                className="cursor-not-allowed rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-slate-400"
              >
                Running...
              </button>
            )}
            {step === 'completed' && (
              <button
                onClick={onCancel}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700 hover:shadow-lg"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export type { HousekeepingInfo, HousekeepingStep };
