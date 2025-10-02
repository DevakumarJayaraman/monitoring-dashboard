import { useState } from "react";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { Footer } from "./components/layout/Footer";
import { InfrastructureView } from "./components/infrastructure/InfrastructureView";
import { ServicesView } from "./components/services/ServicesView";
import { AddInfrastructureModal, type InfrastructureData } from "./components/modals/AddInfrastructureModal";
import { AddServiceModal, type ServiceData } from "./components/modals/AddServiceModal";

type AppView = "infrastructure" | "services";

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>("infrastructure");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAddInfraModalOpen, setIsAddInfraModalOpen] = useState(false);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);

  const handleSaveInfrastructure = (data: InfrastructureData) => {
    console.log('New infrastructure data:', data);
    // Here you would typically send the data to your backend API
  };

  const handleSaveService = (data: ServiceData) => {
    console.log('New service data:', data);
    // Here you would typically send the data to your backend API
  };

  const renderContent = () => {
    switch (currentView) {
      case "infrastructure":
        return <InfrastructureView />;
      case "services":
        return <ServicesView />;
      default:
        return <InfrastructureView />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Header - Full Width */}
      <Header />

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
      <AddInfrastructureModal
        isOpen={isAddInfraModalOpen}
        onClose={() => setIsAddInfraModalOpen(false)}
        onSave={handleSaveInfrastructure}
      />
      <AddServiceModal
        isOpen={isAddServiceModalOpen}
        onClose={() => setIsAddServiceModalOpen(false)}
        onSave={handleSaveService}
      />
    </div>
  );
}
