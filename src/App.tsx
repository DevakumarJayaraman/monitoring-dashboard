import { useState } from "react";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { Footer } from "./components/layout/Footer";
import { InfrastructureView } from "./components/infrastructure/InfrastructureView";
import { ServicesView } from "./components/services/ServicesView";
import { ProjectSelection } from "./components/project/ProjectSelection";
import { InfrastructureFormModal } from "./components/infrastructure/InfrastructureFormModal";
import { AddServiceModal, type ServiceData } from "./components/modals/AddServiceModal";
import type { Project } from "./types/project";

type AppView = "infrastructure" | "services";

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>("infrastructure");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAddInfraModalOpen, setIsAddInfraModalOpen] = useState(false);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSaveService = (data: ServiceData) => {
    console.log('New service data:', data);
    // Here you would typically send the data to your backend API
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
        return <ServicesView selectedProject={selectedProject} />;
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
        projectId={selectedProject ? parseInt(selectedProject.id) : undefined}
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
      />
    </div>
  );
}
