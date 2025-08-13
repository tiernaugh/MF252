import { useMemo, useState } from 'react';
import { AvatarOrb } from '../components/brand/AvatarOrb';
import { ProjectSettings } from '../components/project/ProjectSettings';

type ProjectOverviewProps = {
  project: { id: string; name: string; shortSummary: string };
  episodes: { id: string; title: string; summary: string; publishedAt: string }[];
  upcoming?: {
    status: 'scheduled' | 'assembling' | 'published';
    scheduledAt?: string;
    feedbackUntil?: string;
    previewQuestions?: string[];
  };
  onOpenEpisode: () => void;
};

export function ProjectOverview({ project, episodes, upcoming, onOpenEpisode }: ProjectOverviewProps) {
  const [q, setQ] = useState('');

  // Order: Latest → Upcoming → Divider → Previous (filtered)
  const latest = episodes[0];
  const previous = episodes.slice(1);
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return previous;
    return previous.filter(e => e.title.toLowerCase().includes(t) || e.summary.toLowerCase().includes(t));
  }, [q, previous]);

  const episodeCount = episodes.length;

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Refined, minimal header */}
        <header className="flex items-center justify-between mb-12 animate-fade-in">
          <div className="flex items-center gap-3">
            <AvatarOrb size={40} />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{project.name}</h1>
              <p className="text-xs uppercase tracking-wider text-gray-500">
                Weekly Intelligence • {episodeCount} Episodes • Active
              </p>
            </div>
          </div>
          <ProjectSettings />
        </header>

        {/* Divider line */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-12" />

        {/* Latest episode - EDITORIAL HERO */}
        {latest && (
          <article className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {/* Episode metadata */}
            <div className="flex items-center gap-4 mb-8">
              <span className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                Episode 4
              </span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span className="text-xs uppercase tracking-wider text-gray-500">
                15 min read
              </span>
            </div>

            {/* Episode title - large and confident */}
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 leading-tight mb-6 [text-wrap:balance] max-w-[20ch]">
              The Great Client Expectation Shift
            </h2>

            {/* Visual interest - subtle pattern/texture could go here */}
            <div className="relative mb-8">
              {/* Optional: Add subtle geometric pattern or gradient backdrop */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent rounded-lg opacity-50" />
              
              {/* Pull quote - hero element */}
              <blockquote className="relative border-l-4 border-gray-900 pl-6 py-4">
                <p className="text-xl md:text-2xl font-serif italic text-gray-800 leading-relaxed">
                  "The real disruption isn't AI replacing consultants—it's clients expecting consultants to be AI orchestrators."
                </p>
              </blockquote>
            </div>

            {/* Episode description */}
            <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-3xl">
              What financial services clients are actually hiring design consultancies for in the AI era
            </p>

            {/* CTA - prominent and editorial */}
            <button
              onClick={onOpenEpisode}
              type="button"
              className="group inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            >
              Read episode
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </article>
        )}

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-16" />

        {/* Upcoming - secondary but visible */}
        {upcoming?.status === 'scheduled' && (
          <section className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-6">
              Coming {upcoming.scheduledAt ? new Date(upcoming.scheduledAt).toLocaleDateString('en-GB', { weekday: 'long' }) : 'Soon'}
            </h3>
            {upcoming.previewQuestions && upcoming.previewQuestions.length > 0 && (
              <div className="space-y-3">
                {upcoming.previewQuestions.slice(0, 2).map((question) => (
                  <div key={question} className="flex items-start gap-3">
                    <span className="text-gray-400 mt-1">→</span>
                    <p className="text-base text-gray-700 leading-relaxed">{question}</p>
                  </div>
                ))}
              </div>
            )}
            {upcoming.feedbackUntil && (
              <p className="text-sm text-gray-500 mt-4">
                You can influence this episode for another 6 hours
              </p>
            )}
          </section>
        )}

        {/* Previous episodes - tertiary */}
        {previous.length > 0 && (
          <>
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-16" />
            
            <section className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <h3 className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-6">
                Previous Episodes
              </h3>
              
              {/* Search */}
              <div className="mb-6">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search episodes..."
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
                />
              </div>
              
              {/* Episode list */}
              {filtered.length === 0 ? (
                <p className="text-sm text-gray-500">No matches found.</p>
              ) : (
                <div className="space-y-4">
                  {filtered.map((episode) => (
                    <button
                      key={episode.id}
                      type="button"
                      className="w-full text-left group hover:bg-gray-50 rounded-lg p-4 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
                            {episode.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {episode.summary}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            Published {new Date(episode.publishedAt).toLocaleDateString('en-GB', { 
                              day: 'numeric', 
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <span className="text-gray-400 group-hover:text-gray-600 transition-colors ml-4">
                          →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}


