// React 17+ JSX runtime assumed

export type ProjectSummary = {
  id: string;
  name: string;
  shortSummary: string;
  isPaused: boolean;
  nextScheduledAt: string | null;
  lastPublishedAt: string | null;
  episodeCount: number;
};

type SortKey = 'az' | 'lastPublished';
type StatusFilter = 'all' | 'active' | 'paused';

type ProjectsIndexProps = {
  projects: ProjectSummary[];
  onOpenProject: (id: string) => void;
  onNewProject?: () => void;
};

export function ProjectsIndex({ projects, onOpenProject, onNewProject }: ProjectsIndexProps) {
  // Local UI state (prototype only)
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('lastPublished');
  const [status, setStatus] = useState<StatusFilter>('all');

  const filtered = useMemo(() => {
    let items = projects;
    if (status !== 'all') {
      items = items.filter((p) => (status === 'paused' ? p.isPaused : !p.isPaused));
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(q) || p.shortSummary.toLowerCase().includes(q));
    }
    if (sort === 'az') {
      items = [...items].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // 'lastPublished'
      items = [...items].sort((a, b) =>
        (b.lastPublishedAt ? Date.parse(b.lastPublishedAt) : 0) - (a.lastPublishedAt ? Date.parse(a.lastPublishedAt) : 0)
      );
    }
    return items;
  }, [projects, query, sort, status]);

  const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

  return (
    <div className="w-full">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Projects</h1>
          <button
            type="button"
            className="px-3 py-2 rounded bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            onClick={() => {
              console.log('new_project_clicked');
              onNewProject?.();
            }}
          >
            New project
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 flex items-center gap-3">
            <input
              aria-label="Search projects"
              placeholder="Search projects"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full sm:w-80 rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            <select
              aria-label="Sort projects"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              <option value="lastPublished">Sort: Last published</option>
              <option value="az">Sort: A–Z</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'active', 'paused'] as StatusFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatus(f)}
                className={
                  `px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    status === f ? 'border-gray-900 text-gray-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`
                }
                aria-pressed={status === f}
              >
                {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Paused'}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                console.log('project_card_opened', p.id);
                onOpenProject(p.id);
              }}
              className={
                `group relative text-left rounded-lg bg-white p-8 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-300 ${
                  p.isPaused
                    ? 'border border-gray-200 hover:shadow-sm'
                    : 'border border-gray-200 hover:shadow-sm hover:-translate-y-0.5'
                }`
              }
            >
              {/* Project icon placeholder + status */}
              <div className="flex items-start justify-between mb-6">
                <div 
                  className={
                    `w-12 h-12 rounded-full border flex items-center justify-center text-base font-semibold ${
                      p.isPaused 
                        ? 'border-gray-300 bg-gray-100 text-gray-600' 
                        : 'border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700'
                    }`
                  }
                  title="Project icon placeholder"
                >
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
                <div 
                  className={`w-3 h-3 rounded-full ${p.isPaused ? 'bg-gray-300' : 'bg-green-400'}`}
                  title={p.isPaused ? 'Paused' : 'Active'}
                />
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h3 className={`text-xl font-bold leading-tight line-clamp-2 ${p.isPaused ? 'text-gray-700' : 'text-gray-900'}`}>
                  {p.name}
                </h3>
                <p className={`text-base leading-relaxed line-clamp-3 ${p.isPaused ? 'text-gray-500' : 'text-gray-600'}`}>
                  {p.shortSummary}
                </p>
              </div>

              {/* Meta information */}
              <div className={`mt-6 pt-6 border-t space-y-2 ${p.isPaused ? 'border-gray-100' : 'border-gray-150'}`}>
                <div className={`text-sm ${p.isPaused ? 'text-gray-400' : 'text-gray-500'}`}>
                  Last published {formatDate(p.lastPublishedAt)}
                </div>
                <div className={`text-sm font-medium ${p.isPaused ? 'text-gray-500' : 'text-gray-600'}`}>
                  {p.episodeCount} episodes
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-lg border border-gray-200 p-8 text-center">
              <div className="text-gray-500 text-sm">No projects found.</div>
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
