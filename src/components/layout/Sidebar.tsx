import { useState, ReactNode } from "react";

type AppView = "infrastructure" | "services";

interface SidebarProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  onAddInfrastructure?: () => void;
  onAddService?: () => void;
}

interface NavItem {
  id: AppView;
  label: string;
  icon: ReactNode;
  badge?: string;
  submenu?: { id: string; label: string }[];
}

interface NavItemProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  isExpanded: boolean;
  onClick: () => void;
  onToggleSubmenu: () => void;
}

// Reusable Navigation Item Component
function NavigationItem({ item, isActive, isCollapsed, isExpanded, onClick, onToggleSubmenu }: NavItemProps) {
  const baseClasses = "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200";
  const activeClasses = isActive ? "bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/20" : "text-slate-300 hover:bg-slate-800 hover:text-slate-100 hover:scale-[1.02]";

  const handleClick = () => {
    onClick();
    if (item.submenu) onToggleSubmenu();
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`${baseClasses} ${activeClasses}`}
        title={isCollapsed ? item.label : undefined}
      >
        <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">{item.icon}</span>
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium transition-all duration-200 ${
                isActive ? "bg-emerald-600 text-emerald-100" : "bg-slate-700 text-slate-300"
              }`}>
                {item.badge}
              </span>
            )}
            {item.submenu && (
              <svg className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </>
        )}
      </button>

      {/* Submenu */}
      {item.submenu && !isCollapsed && (
        <div className={`ml-6 mt-1 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          {item.submenu.map((subItem) => (
            <button key={subItem.id} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 transition-all duration-200 hover:bg-slate-800 hover:text-slate-200 hover:translate-x-1">
              <div className="h-1 w-1 rounded-full bg-slate-500"></div>
              {subItem.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ activeView, onViewChange, isCollapsed, onToggleCollapse, onAddInfrastructure, onAddService }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showAdminActionsMenu, setShowAdminActionsMenu] = useState(false);

  const navigationItems: NavItem[] = [
    {
      id: "infrastructure",
      label: "Infrastructure",
      badge: "12",
      icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2 4h.01M5 16h.01" /></svg>,
    },
    {
      id: "services",
      label: "Services",
      badge: "8",
      icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    },
  ];

  const toggleSubmenu = (itemId: string) => {
    if (isCollapsed) return;
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      newSet.has(itemId) ? newSet.delete(itemId) : newSet.add(itemId);
      return newSet;
    });
  };

  return (
    <aside className={`flex flex-col border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 pt-4">
        {navigationItems.map((item) => (
          <NavigationItem
            key={item.id}
            item={item}
            isActive={activeView === item.id}
            isCollapsed={isCollapsed}
            isExpanded={expandedItems.has(item.id)}
            onClick={() => onViewChange(item.id)}
            onToggleSubmenu={() => toggleSubmenu(item.id)}
          />
        ))}
      </nav>

      {/* Admin Actions */}
      <div className="relative border-t border-slate-800 p-3">
        <button
          onClick={() => setShowAdminActionsMenu(!showAdminActionsMenu)}
          className={`flex w-full items-center ${isCollapsed ? 'justify-center' : 'gap-3'} rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-all duration-200 border border-slate-600 hover:border-slate-500`}
          title="Admin Actions"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {!isCollapsed && <span>Admin Actions</span>}
        </button>

        {/* Popup Menu */}
        {showAdminActionsMenu && (
          <>
            {/* Backdrop to close menu */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowAdminActionsMenu(false)}
            />
            
            {/* Menu */}
            <div className={`absolute ${isCollapsed ? 'bottom-0 left-16 ml-3' : 'bottom-full left-0 mb-3'} w-64 rounded-lg border border-slate-700 bg-slate-800 shadow-xl z-50 overflow-hidden`}>
              <div className="p-2 space-y-1">
                <button
                  onClick={() => {
                    onAddInfrastructure?.();
                    setShowAdminActionsMenu(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-300 transition-all duration-200"
                >
                  <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Infrastructure</span>
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement edit infrastructure
                    console.log('Edit Infrastructure clicked');
                    setShowAdminActionsMenu(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-300 transition-all duration-200"
                >
                  <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Infrastructure</span>
                </button>
                <button
                  onClick={() => {
                    onAddService?.();
                    setShowAdminActionsMenu(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-blue-500/10 hover:text-blue-300 transition-all duration-200"
                >
                  <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Service</span>
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement edit service
                    console.log('Edit Service clicked');
                    setShowAdminActionsMenu(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-blue-500/10 hover:text-blue-300 transition-all duration-200"
                >
                  <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Service</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Collapse/Expand Toggle at Bottom */}
      {onToggleCollapse && (
        <div className="border-t border-slate-800 p-3">
          <button
            onClick={onToggleCollapse}
            className="flex w-full items-center justify-center rounded-lg p-2 text-slate-400 transition-all duration-200 hover:bg-slate-800 hover:text-slate-200"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg 
              className={`h-5 w-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {!isCollapsed && <span className="ml-2 text-sm font-medium">Collapse</span>}
          </button>
        </div>
      )}
    </aside>
  );
}