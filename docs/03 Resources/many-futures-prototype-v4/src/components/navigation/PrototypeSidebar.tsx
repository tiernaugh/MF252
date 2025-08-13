// React import not required for React 17+ with jsx runtime

type NavTarget = 'home' | 'projects' | 'notifications' | 'profile';

export function PrototypeSidebar({ onNavigate }: { onNavigate: (t: NavTarget) => void }) {
  return (
    <aside className="w-64 shrink-0 border-r border-gray-100 bg-white/80 backdrop-blur">
      <div className="p-4 border-b border-gray-100">
        <div className="text-sm font-medium text-gray-500">Many Futures</div>
      </div>
      <nav className="p-2 space-y-1">
        {/* Adopted pattern: minimal left sidebar with groups. */}
        <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-50" onClick={() => onNavigate('home')}>Home</button>
        <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-50" onClick={() => onNavigate('projects')}>Projects</button>
        <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-50" onClick={() => onNavigate('notifications')}>Notifications</button>
        <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-50" onClick={() => onNavigate('profile')}>Profile</button>
      </nav>
      <div className="mt-auto p-4 text-xs text-gray-400">
        {/* Comments: This is a prototype-only sidebar. In production, use GlobalSidebar from design-system. */}
        Prototype sidebar (comments: adopt next‑forge patterns; persist in ADR only).
      </div>
    </aside>
  );
}


