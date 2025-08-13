// React import not required for React 17+ with jsx runtime
import { SettingsIcon } from 'lucide-react';

export function ProjectSettings() {
  const handleSettingsClick = () => {
    window.location.hash = '#project-settings';
  };

  return (
    <button type="button"
      onClick={handleSettingsClick}
      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
      aria-label="Project Settings"
    >
      <SettingsIcon size={20} className="text-gray-500" />
      <span className="hidden md:inline">Project settings</span>
    </button>
  );
}