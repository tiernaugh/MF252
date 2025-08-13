// React import not required for React 17+ with jsx runtime

type HomeViewProps = {
  project: { id: string; name: string; shortSummary: string };
  latestEpisode: { id: string; title: string; publishedAt: string };
  pinnedProject: {
    id: string;
    name: string;
    shortSummary: string;
    isPaused: boolean;
    nextScheduledAt: string | null;
  };
  recentlyPublished: Array<{
    id: string;
    projectName: string;
    title: string;
    publishedAt: string;
  }>;
  onOpenProject: () => void;
  onContinueReading: () => void;
  onTogglePausePinned: () => void;
};

export function HomeView({
  project,
  latestEpisode,
  pinnedProject,
  recentlyPublished,
  onOpenProject,
  onContinueReading,
  onTogglePausePinned,
}: HomeViewProps) {
  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

  return (
    <div className="w-full">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <h1 className="text-xl font-semibold">Home</h1>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Continue Reading */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-2">Continue reading</h2>
          <div className="rounded-lg border border-gray-100 p-4 flex items-center justify-between">
            <div>
              <div className="text-gray-900">{latestEpisode.title}</div>
              <div className="text-sm text-gray-500">Published {formatDate(latestEpisode.publishedAt)}</div>
            </div>
            <button className="px-3 py-2 rounded bg-gray-900 text-white" onClick={onContinueReading}>
              Open episode
            </button>
          </div>
        </section>

        {/* Pinned Project */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-2">Pinned project</h2>
          <div className="rounded-lg border border-gray-100 p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-gray-900 font-medium mb-1">{pinnedProject.name}</div>
                <div className="text-sm text-gray-600">{pinnedProject.shortSummary}</div>
              </div>
              <span
                className={
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ' +
                  (pinnedProject.isPaused ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800')
                }
              >
                {pinnedProject.isPaused ? 'Paused' : 'Scheduled'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {pinnedProject.isPaused ? 'Next episode: —' : `Next episode ${formatDate(pinnedProject.nextScheduledAt)}`}
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-2 rounded border border-gray-200 hover:bg-gray-50" onClick={onOpenProject}>
                  Open project
                </button>
                <button className="px-3 py-2 rounded border border-gray-200 hover:bg-gray-50" onClick={onTogglePausePinned}>
                  {pinnedProject.isPaused ? 'Resume' : 'Pause'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Your Projects */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-2">Your projects</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-100 p-4">
              <div className="text-gray-900 font-medium mb-1">{project.name}</div>
              <div className="text-sm text-gray-600 mb-3">{project.shortSummary}</div>
              <button className="px-3 py-2 rounded border border-gray-200 hover:bg-gray-50" onClick={onOpenProject}>
                Open project
              </button>
            </div>
            {/* Additional mock cards could be added here. */}
          </div>
        </section>

        {/* Recently Published */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-2">Recently published</h2>
          <div className="space-y-2">
            {recentlyPublished.map((ep) => (
              <div key={ep.id} className="rounded-lg border border-gray-100 p-4 flex items-center justify-between">
                <div>
                  <div className="text-gray-900">{ep.title}</div>
                  <div className="text-sm text-gray-500">
                    {ep.projectName} • {formatDate(ep.publishedAt)}
                  </div>
                </div>
                <button className="px-3 py-2 rounded border border-gray-200 hover:bg-gray-50" onClick={onContinueReading}>
                  Open episode
                </button>
              </div>
            ))}
            {recentlyPublished.length === 0 && (
              <div className="rounded-lg border border-gray-100 p-4 text-sm text-gray-500">No recent episodes.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}


