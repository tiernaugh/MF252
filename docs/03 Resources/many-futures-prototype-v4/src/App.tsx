
import { useEffect, useMemo, useState } from 'react';
import { EpisodeRenderer } from './components/episode/EpisodeRenderer';
import type { Episode } from './types/episode';
import mockEpisodeData from './data/mock-episode.json';
import { PrototypeSidebar } from './components/navigation/PrototypeSidebar';
import { ProjectsIndex } from './views/ProjectsIndex';
import { ProjectOverview } from './views/ProjectOverview';
import { ProjectSettings } from './views/ProjectSettings';
import { NewProjectConversationSimple } from './views/NewProjectConversationSimple';

function App() {
  const episode = mockEpisodeData as Episode;

  type View = 'home' | 'project' | 'episode' | 'project-settings' | 'new-project';
  const initialView: View = useMemo(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'project') return 'project';
    if (hash === 'episode') return 'episode';
    if (hash === 'project-settings') return 'project-settings';
    if (hash === 'new-project') return 'new-project';
    return 'home';
  }, []);

  const [view, setView] = useState<View>(initialView);

  // Seed mock projects for index
  const mockProjects = useMemo(
    () =>
      [
        {
          id: episode.project.id,
          name: episode.project.name,
          shortSummary: 'Agent-authored overview of the project direction (mock).',
          isPaused: false,
          nextScheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
          lastPublishedAt: episode.metadata.publicationTimestamp,
          episodeCount: 4,
        },
        {
          id: 'proj-growth-ops',
          name: 'Growth Ops in AI-native Firms',
          shortSummary: 'How AI compresses ops cycles and shifts growth levers in B2B.',
          isPaused: false,
          nextScheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
          lastPublishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
          episodeCount: 9,
        },
        {
          id: 'proj-public-sector',
          name: 'AI in Public Sector Service Delivery',
          shortSummary: 'Service triage automation and fairness constraints in GovTech.',
          isPaused: true,
          nextScheduledAt: null,
          lastPublishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
          episodeCount: 6,
        },
        {
          id: 'proj-fincrime',
          name: 'Real-time FinCrime Monitoring',
          shortSummary: 'Pattern detection trade-offs under strict regulatory oversight.',
          isPaused: false,
          nextScheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
          lastPublishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
          episodeCount: 12,
        },
        {
          id: 'proj-retail',
          name: 'Retail Experience After Generative AI',
          shortSummary: 'From product search to purchase orchestration in omnichannel.',
          isPaused: false,
          nextScheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString(),
          lastPublishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
          episodeCount: 3,
        },
        {
          id: 'proj-health',
          name: 'Clinical Workflows & AI Assistants',
          shortSummary: 'Safety, provenance and handoff in high‑stakes environments.',
          isPaused: true,
          nextScheduledAt: null,
          lastPublishedAt: null,
          episodeCount: 0,
        },
        {
          id: 'proj-legal',
          name: 'AI in Legal Services',
          shortSummary: 'Pricing, discovery, and partner leverage shift with LLM tooling.',
          isPaused: false,
          nextScheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
          lastPublishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
          episodeCount: 2,
        },
        {
          id: 'proj-edu',
          name: 'Higher Ed Strategy & Automation',
          shortSummary: 'Enrollment cliffs and workforce prep in an AI economy.',
          isPaused: false,
          nextScheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toISOString(),
          lastPublishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
          episodeCount: 5,
        },
      ],
    [episode]
  );

  useEffect(() => {
    const onHashChange = () => {
      const h = window.location.hash.replace('#', '');
      if (h === 'project' || h === 'home' || h === 'episode' || h === 'project-settings' || h === 'new-project') {
        setView(h as View);
      }
    };

    const onProject = () => {
      setView('project');
    };

    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('navigate:project', onProject as EventListener);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('navigate:project', onProject as EventListener);
    };
  }, []);

  return (
    <div className="App min-h-screen bg-white">
      {view === 'episode' && (
        // Episodes intentionally have no sidebar provider (reading surface is clean)
        <EpisodeRenderer episode={episode} />
      )}

      {view === 'project-settings' && (
        // Project Settings page has no sidebar (focused editing surface)
        <ProjectSettings project={episode.project} />
      )}

      {view === 'new-project' && (
        // New Project conversation has no sidebar (focused creation flow)
        <NewProjectConversationSimple />
      )}

      {view !== 'episode' && view !== 'project-settings' && view !== 'new-project' && (
        <div className="flex min-h-screen">
          {/* Minimal prototype sidebar */}
          <PrototypeSidebar
            onNavigate={(target: string) => {
              window.location.hash = `#${target}`;
              setView(target === 'projects' ? 'project' : (target as View));
            }}
          />
          <main className="flex-1">
            {view === 'home' && (
              <ProjectsIndex
                projects={mockProjects}
                onOpenProject={() => {
                  window.location.hash = '#project';
                  setView('project');
                }}

                onNewProject={() => {
                  window.location.hash = '#new-project';
                  setView('new-project');
                }}
              />
            )}
            {view === 'project' && (
              <ProjectOverview
                project={{ id: episode.project.id, name: episode.project.name, shortSummary: 'Agent-authored overview (mock).' }}
                episodes={[
                  {
                    id: episode.id,
                    title: episode.title,
                    summary: episode.subtitle,
                    publishedAt: episode.metadata.publicationTimestamp,
                  },
                  {
                    id: 'ep-3',
                    title: 'Reframing Value in AI Consulting',
                    summary: 'How outcomes replaced output as the premium signal in client conversations.',
                    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
                  },
                  {
                    id: 'ep-2',
                    title: 'Design Workflows After AI',
                    summary: 'What happens when orchestration becomes the craft and delivery compresses to minutes.',
                    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
                  },
                  {
                    id: 'ep-1',
                    title: 'Signals of Change in Professional Services',
                    summary: 'The earliest signs that client decision cycles are fragmenting—and why that matters.',
                    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
                  },
                ]}
                upcoming={{
                  status: 'scheduled',
                  scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
                  feedbackUntil: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
                  previewQuestions: ['Are we leaning too much toward vendor narratives?', 'Should we widen the lens to workforce implications?'],
                }}
                onOpenEpisode={() => {
                  window.location.hash = '#episode';
                  setView('episode');
                }}
              />
            )}
          </main>
        </div>
      )}
    </div>
  );
}

export default App;