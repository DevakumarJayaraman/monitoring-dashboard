import { useState } from "react";
import type { JSX } from "react";
import type { ServicesInstance, ServiceStatus } from "../../types/infrastructure";

export interface ActionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<ActionResult[]>;
  action: "start" | "stop";
  actionType: "all" | "selected";
  instances: ServicesInstance[];
  serviceNames?: string[];
}

export interface ActionResult {
  instanceId: string;
  serviceName: string;
  success: boolean;
  message: string;
}

export function ActionConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  actionType,
  instances,
  serviceNames = [],
}: ActionConfirmationModalProps): JSX.Element {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<ActionResult[]>([]);

  if (!isOpen) return <></>;

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const actionResults = await onConfirm();
      setResults(actionResults);
      setShowResults(true);
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setShowResults(false);
    setResults([]);
    setIsProcessing(false);
    onClose();
  };

  const actionVerb = action === "start" ? "Starting" : "Stopping";
  const actionPastTense = action === "start" ? "started" : "stopped";

  const normaliseStatus = (instance: ServicesInstance): ServiceStatus => {
    const raw = instance.status?.toLowerCase();
    if (raw === "starting") return "starting";
    if (raw === "stopping") return "stopping";
    if (raw === "degraded") return "degraded";
    if (raw === "restarting") return "restarting";
    if (raw === "stopped") return "stopped";
    if ((raw === "running" || raw === undefined) && instance.uptime <= 0) return "restarting";
    return "running";
  };

  const statusBadgeClass = (status: ServiceStatus): string => {
    if (status === "running") {
      return "bg-emerald-400/10 text-emerald-300 border border-emerald-400/20";
    }
    if (status === "restarting") {
      return "bg-sky-400/10 text-sky-300 border border-sky-400/20";
    }
    if (status === "starting") {
      return "bg-cyan-400/10 text-cyan-300 border border-cyan-400/20";
    }
    if (status === "stopping") {
      return "bg-orange-400/10 text-orange-300 border border-orange-400/20";
    }
    if (status === "stopped") {
      return "bg-rose-400/10 text-rose-300 border border-rose-400/20";
    }
    return "bg-amber-400/10 text-amber-300 border border-amber-400/20"; // degraded
  };

  // Group instances by service for better display
  const instancesByService = instances.reduce((acc, instance) => {
    const serviceName = instance.serviceName 
      || serviceNames.find(name => instance.id.includes(name)) 
      || "Unknown Service";
    if (!acc[serviceName]) {
      acc[serviceName] = [];
    }
    acc[serviceName].push(instance);
    return acc;
  }, {} as Record<string, ServicesInstance[]>);

  const successfulResults = results.filter(r => r.success);
  const failedResults = results.filter(r => !r.success);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-2xl rounded-lg border border-slate-700 bg-slate-900 shadow-2xl">
        {!showResults ? (
          <>
            {/* Confirmation View */}
            <div className="border-b border-slate-700 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-100">
                Confirm {action === "start" ? "Start" : "Stop"} Action
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {actionType === "all" 
                  ? `You're about to ${action} all visible services` 
                  : `You're about to ${action} selected instances`}
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto px-6 py-4">
              {instances.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="text-slate-400 text-sm">
                      No {action === "start" ? "stopped" : "running"} instances found to {action}
                    </div>
                    <div className="text-slate-500 text-xs mt-1">
                      {action === "start" 
                        ? "All selected instances are already running" 
                        : "All selected instances are already stopped"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(instancesByService).map(([serviceName, serviceInstances]) => (
                    <div key={serviceName} className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                      <h3 className="font-medium text-slate-200 mb-3">{serviceName}</h3>
                      <div className="space-y-2">
                        {serviceInstances.map((instance) => {
                          const status = normaliseStatus(instance);
                          const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
                          return (
                            <div key={instance.id} className="space-y-1 rounded border border-slate-800 bg-slate-900/50 px-3 py-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-sm font-medium text-slate-200">
                                  {instance.serviceName || serviceName} - {instance.profile} - {instance.machineName}
                                </span>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(status)}`}>
                                  {statusLabel}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                                <code className="text-slate-400">{instance.id}</code>
                                {instance.uptime > 0 && (
                                  <span>
                                    Uptime: {Math.floor(instance.uptime / 3600)}h {Math.floor((instance.uptime % 3600) / 60)}m
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-700 px-6 py-4">
              <div className="text-sm text-slate-400">
                {instances.length > 0 ? (
                  `${instances.length} instance${instances.length !== 1 ? 's' : ''} across ${Object.keys(instancesByService).length} service${Object.keys(instancesByService).length !== 1 ? 's' : ''}`
                ) : (
                  `No ${action === "start" ? "stopped" : "running"} instances to ${action}`
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                  disabled={isProcessing}
                >
                  {instances.length === 0 ? 'Close' : 'Cancel'}
                </button>
                {instances.length > 0 && (
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isProcessing}
                    className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                      action === "start"
                        ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20"
                        : "border-rose-400/50 bg-rose-400/10 text-rose-200 hover:bg-rose-400/20"
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        {actionVerb}...
                      </>
                    ) : (
                      <>
                        {action === "start" ? "▶" : "■"} Confirm {action === "start" ? "Start" : "Stop"}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Results View */}
            <div className="border-b border-slate-700 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-100">Action Results</h2>
              <p className="mt-1 text-sm text-slate-400">
                Summary of {action} operations
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {/* Success Summary */}
                {successfulResults.length > 0 && (
                  <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/5 p-4">
                    <h3 className="font-medium text-emerald-200 mb-3">
                      ✓ Successfully {actionPastTense} ({successfulResults.length})
                    </h3>
                    <div className="space-y-2">
                      {successfulResults.map((result) => (
                        <div key={result.instanceId} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-emerald-300">{result.instanceId}</code>
                            <span className="text-emerald-400">{result.serviceName}</span>
                          </div>
                          <span className="text-emerald-300">{result.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Failure Summary */}
                {failedResults.length > 0 && (
                  <div className="rounded-lg border border-rose-400/30 bg-rose-400/5 p-4">
                    <h3 className="font-medium text-rose-200 mb-3">
                      ✗ Failed to {action} ({failedResults.length})
                    </h3>
                    <div className="space-y-2">
                      {failedResults.map((result) => (
                        <div key={result.instanceId} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <code className="text-xs text-rose-300">{result.instanceId}</code>
                            <span className="text-rose-400">{result.serviceName}</span>
                          </div>
                          <span className="text-rose-300">{result.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-700 px-6 py-4">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-emerald-400">
                  {successfulResults.length} successful
                </span>
                {failedResults.length > 0 && (
                  <span className="text-rose-400">
                    {failedResults.length} failed
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
