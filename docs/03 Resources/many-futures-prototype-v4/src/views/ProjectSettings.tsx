import { useMemo } from 'react';
/**
 * Project Settings (Prototype)
 *
 * Context:
 * - MVP consolidates all project settings into a single page (no tabs).
 * - Project titles are system-managed and displayed as read-only fields (not editable in MVP).
 * - Project Brief is read-only here and edited via a versioned Instructions modal (guards against drift).
 * - Cadence is simplified for MVP: Daily only, following our earlier decision for learning velocity.
 * - "Memories" mirrors ChatGPT-style transparency: simple, removable statements (Mem0-backed later).
 * - Notifications settings removed for MVP simplicity.
 */
import { ChevronLeftIcon, ClockIcon, PauseCircleIcon, TrashIcon } from 'lucide-react';

type Project = { id: string; name: string };
interface ProjectSettingsProps { project: Project }

export function ProjectSettings({ project }: ProjectSettingsProps) {
  // Prototype: derive next date on the client from selected cadence
  // Production: replace with server-provided `projects.next_scheduled_at`
  const nextEpisodeDate = useMemo(() => {
    const next = new Date();
    next.setDate(next.getDate() + 1); // Daily cadence for MVP
    return next;
  }, []);

  const handleBack = () => {
    window.location.hash = '#project';
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button type="button"
              onClick={handleBack}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeftIcon size={16} />
              Back to Project
            </button>
            <div className="h-4 w-px bg-gray-300" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Project Settings</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Single Page */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <ProjectSettingsContent project={project} nextEpisodeDate={nextEpisodeDate} />
      </div>
    </div>
  );
}

function ProjectSettingsContent({ project, nextEpisodeDate }: { 
  project: Project; 
  nextEpisodeDate: Date;
}) {
  // Mock memory items for prototype with more entries to test scroll
  const memoryItems = [
    "Interested in UK regulatory context",
    "Engages with contrarian perspectives", 
    "Focus on strategic positioning over tool reviews",
    "Prefers policy-focused analysis over product reviews",
    "Values second-order effects on organizational design",
    "Seeks comparative examples between UK/EU and US markets"
  ];

  return (
    <div className="space-y-8">
      {/* Project Overview (Title + Brief) */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Project Overview</h3>
          <p className="text-sm text-gray-600">
            Title and core brief that guide episode generation and research focus for this project.
          </p>
        </div>

        {/* Title */}
        <div className="mb-3">
          <p className="text-2xl font-bold text-gray-900">{project.name}</p>
        </div>

        {/* Brief (scrollable) */}
        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md p-4 bg-gray-50">
          <div className="prose prose-sm text-gray-800 max-w-none space-y-4">
            <p>
              How artificial intelligence might reshape the landscape for design consultancies, particularly those serving financial services clients in the UK market.
            </p>
            <p>
              This project explores the strategic opportunities and risks that AI development presents for a mid-sized design consultancy. The exploration centers on understanding how AI capabilities might affect client relationships, service delivery models, and competitive positioning for a 30-person firm specializing in product design, service design, and strategic design work.
            </p>
            <p>
              The investigation focuses specifically on the financial services sector context, where regulatory complexity, client expectations, and compliance requirements create unique dynamics around technology adoption. This includes examining how AI tools might change what clients value from external design expertise, how regulatory frameworks like FCA guidance might shape AI implementation approaches, and what new capabilities or service offerings might become valuable.
            </p>
            <p>
              Key areas of exploration include the evolution of client-consultancy relationships as AI tools become more prevalent, the potential for new types of design challenges emerging from AI implementation needs, and the competitive dynamics between different sizes and types of consultancies as AI adoption accelerates. The project also investigates timing considerations — understanding when various AI-driven changes might become significant for strategic planning and business development decisions.
            </p>
            <p>
              The research examines both immediate considerations (6–18 month horizon) for operational planning and longer‑term possibilities (2–5 year horizon) for strategic positioning. This includes exploring scenarios where AI creates new opportunities for design consultancies, challenges traditional service models, or reshapes the competitive landscape in unexpected ways.
            </p>
            <p>
              Geographic focus centers on the UK market, with particular attention to Edinburgh's professional services ecosystem and the broader regulatory environment affecting financial services design work. The exploration considers how local market dynamics, regulatory requirements, and client procurement patterns might influence AI adoption timelines and strategic responses.
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Project descriptions cannot be changed while a project is live. Create a new project to explore a different brief.
          </p>
        </div>
      </section>

      {/* Episode Schedule */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ClockIcon size={20} className="text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Episode Schedule</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Episode cadence</div>
              <div className="text-sm text-gray-600">How often new episodes are published</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">Daily</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">Next episode</div>
              <div className="text-sm text-gray-600">
                {nextEpisodeDate.toLocaleDateString('en-GB', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'short' 
                })}
              </div>
            </div>
            <button type="button" className="px-3 py-1 text-xs border border-orange-300 text-orange-700 bg-orange-50 rounded-md hover:bg-orange-100 transition-colors">
              Pause
            </button>
          </div>
        </div>
      </section>

      {/* Memories with Scroll */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Memories</h3>
        <p className="text-sm text-gray-600 mb-4">These items are learned from your conversations and feedback to inform ongoing research.</p>
        
        {/* Scrollable memory items */}
        <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
          {memoryItems.map((statement) => (
            <div key={statement} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
              <span className="text-sm text-gray-800">{statement}</span>
              <button type="button" className="text-xs text-gray-500 hover:text-red-600 transition-colors">
                Delete
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" defaultChecked className="accent-blue-600" />
            Allow Futura to remember new insights for this project
          </label>
          <button type="button" className="text-sm text-red-600 hover:text-red-700 transition-colors">
            Clear all project memory
          </button>
        </div>
      </section>

      {/* Project Actions - Simplified */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Actions</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <PauseCircleIcon size={20} className="text-orange-500" />
              <div>
                <div className="font-medium text-gray-900">Pause Project</div>
                <div className="text-sm text-gray-600">Stop episode generation temporarily</div>
              </div>
            </div>
            <button type="button" className="px-4 py-2 text-sm border border-orange-300 text-orange-700 bg-orange-50 rounded-md hover:bg-orange-100 transition-colors">
              Pause
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center gap-3">
              <TrashIcon size={20} className="text-red-500" />
              <div>
                <div className="font-medium text-gray-900">Delete Project</div>
                <div className="text-sm text-gray-600">Permanently delete project and all episodes</div>
              </div>
            </div>
            <button type="button" className="px-4 py-2 text-sm border border-red-300 text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors">
              Delete
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}