export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm px-6 py-3">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span>© 2025 Application Control & Monitoring</span>
          <span className="hidden sm:inline">v2.1.0</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
          <span className="hidden sm:inline">All Systems Operational</span>
          <span className="sm:hidden">Operational</span>
        </div>
      </div>
    </footer>
  );
}