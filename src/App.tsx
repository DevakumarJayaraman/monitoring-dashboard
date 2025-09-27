import type { JSX } from "react";
import { useState } from "react";

import { InfrastructureView } from "./components/infrastructure/InfrastructureView";
import { ServicesView } from "./components/services/ServicesView";

type AppView = "infrastructure" | "services";

export default function App(): JSX.Element {
  const [activeView, setActiveView] = useState<AppView>("infrastructure");

  const viewButtonClass = (view: AppView) =>
    view === activeView
      ? "rounded-full bg-emerald-400 px-4 py-1.5 text-sm font-semibold text-emerald-950 shadow-sm"
      : "rounded-full px-4 py-1.5 text-sm font-semibold text-slate-400 transition hover:text-slate-200";

  return (
    <div className="min-h-screen bg-slate-950">
      <main className="mx-auto w-full max-w-6xl px-6 py-16 text-slate-100">
        <section className="space-y-8">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold text-slate-100 sm:text-4xl">
                {activeView === "infrastructure" ? "Infrastructure snapshot" : "Service catalogue"}
              </h1>
              <p className="text-sm text-slate-400 sm:text-base">
                {activeView === "infrastructure"
                  ? "Track CPU and memory utilization across the fleet."
                  : "Explore regional service deployments, links, and health checks."}
              </p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900 p-1">
              <button
                type="button"
                className={viewButtonClass("infrastructure")}
                onClick={() => setActiveView("infrastructure")}
              >
                Infrastructure
              </button>
              <button
                type="button"
                className={viewButtonClass("services")}
                onClick={() => setActiveView("services")}
              >
                Services
              </button>
            </div>
          </header>
          {activeView === "infrastructure" ? <InfrastructureView /> : <ServicesView />}
        </section>
      </main>
    </div>
  );
}
