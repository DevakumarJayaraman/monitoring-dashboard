import { useState } from "react";
import { Header } from "./components/layout/Header.tsx";
import { Sidebar } from "./components/layout/Sidebar.tsx";
import { Footer } from "./components/layout/Footer.tsx";
import { InfrastructureView } from "./components/infrastructure/InfrastructureView.tsx";
import { ServicesView } from "./components/services/ServicesView.tsx";
import { DeploymentConfigView } from "./components/deployment/DeploymentConfigView.tsx";
import { ProjectSelection } from "./components/project/ProjectSelection.tsx";
import { InfrastructureFormModal } from "./components/infrastructure/InfrastructureFormModal.tsx";
import { AddServiceModal, type ComponentFormData } from "./components/modals/AddServiceModal.tsx";
import { Toast } from "./components/shared/Toast.tsx";
import { createComponent, createComponentDeployments } from "./services/api.ts";
import type { Project } from "./types/project.ts";

type AppView = "infrastructure" | "services" | "deployment";

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>("infrastructure");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAddInfraModalOpen, setIsAddInfraModalOpen] = useState(false);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toastState, setToastState] = useState<{
    message: string;
    type: "success" | "error" | "info" | "warning";
    isVisible: boolean;
  }>({
    message: "",
    type: "success",
    isVisible: false,
  });

  const showToast = (message: string, type: "success" | "error" | "info" | "warning" = "success") => {
    setToastState({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToastState((prev) => ({ ...prev, isVisible: false }));
  };

  const handleSaveService = async (data: ComponentFormData) => {
    try {
      const created = await createComponent({
        componentName: data.componentName,
        module: data.module,
        description: data.description,
        projectId: data.projectId,
        defaultInfraType: data.defaultInfraType,
        defaultPort: data.defaultPort,
      });

      // If the form included deployments, create them and associate with the created component
      if (data.deployments && data.deployments.length > 0) {
        const payload = {
          deployments: data.deployments.map(d => ({
            componentId: created.componentId,
            infraId: d.infraId,
            profile: d.profile,
            port: d.port,
            // componentVersion removed in modal; don't send it here
            dynamicParams: d.dynamicParams,
          })),
        };

        await createComponentDeployments(payload);
      }

      showToast("Service component created successfully.", "success");
    } catch (error) {
      console.error("Failed to create service component:", error);
      const message =
        error instanceof Error ? error.message : "Failed to create service component";
      showToast(message, "error");
      throw new Error(message);
    }
  };

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project);
    console.log('Selected project:', project);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
  };

  // Show project selection if no project is selected
  if (!selectedProject) {
    return <ProjectSelection onProjectSelect={handleProjectSelect} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case "infrastructure":
        return <InfrastructureView selectedProject={selectedProject} key={refreshTrigger} />;
      case "services":
        return (
          <ServicesView
            selectedProject={selectedProject}
          />
        );
      case "deployment":
        return (
          <DeploymentConfigView
            selectedProject={selectedProject}
            onShowToast={showToast}
          />
        );
      default:
        return <InfrastructureView selectedProject={selectedProject} key={refreshTrigger} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Header - Full Width */}
      <Header 
        selectedProject={selectedProject}
        onBackToProjects={handleBackToProjects}
      />

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeView={currentView}
          onViewChange={setCurrentView}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onAddInfrastructure={() => setIsAddInfraModalOpen(true)}
          onAddService={() => setIsAddServiceModalOpen(true)}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>

      {/* Footer - Full Width */}
      <Footer />

      {/* Modals */}
      <InfrastructureFormModal
        isOpen={isAddInfraModalOpen}
        machine={null}
        projectId={selectedProject ? parseInt(selectedProject.id, 10) : undefined}
        selectedProject={selectedProject}
        onClose={() => setIsAddInfraModalOpen(false)}
        onSuccess={() => {
          console.log('Infrastructure successfully created/updated via API');
          setIsAddInfraModalOpen(false);
          setRefreshTrigger(prev => prev + 1); // Trigger re-render of InfrastructureView
          // Show success notification (you can add a toast notification library if needed)
          console.log('Infrastructure list refreshed');
        }}
      />
      <AddServiceModal
        isOpen={isAddServiceModalOpen}
        onClose={() => setIsAddServiceModalOpen(false)}
        onSave={handleSaveService}
        projectId={parseInt(selectedProject.id, 10)}
        projectName={selectedProject.name}
      />

      {toastState.isVisible && (
        <Toast
          message={toastState.message}
          type={toastState.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
