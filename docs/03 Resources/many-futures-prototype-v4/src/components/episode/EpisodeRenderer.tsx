import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTextSelection } from '../../hooks/useTextSelection';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import type { Episode } from '../../types/episode';
import { ContentBlock } from '../content/ContentBlock.tsx';
import { HighlightToolbar } from '../highlight/HighlightToolbar';
import { ShareMenu } from '../navigation/ShareMenu';
import { ChatPanelNew } from '../chat/ChatPanelNew';
import { PersistentHighlight } from '../highlight/PersistentHighlight';
import { EpisodeFooterSignal } from './EpisodeFooterSignal';
import { FloatingChatToggle } from '../chat/FloatingChatToggle';
import { useChatStore } from '../../store/useChatStore';
import { InteractiveHoverButton } from '@/components/magicui/interactive-hover-button';

interface EpisodeRendererProps {
  episode: Episode;
}

export function EpisodeRenderer({ episode }: EpisodeRendererProps) {
  const [contentElement, setContentElement] = useState<HTMLDivElement | null>(null);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const { clientRect, text, showToolbar } = useTextSelection(contentElement);
  const scrollDirection = useScrollDirection();
  
  // Chat store hooks
  const { openPanel, addAttachment } = useChatStore();

  const handleAddToChat = (selectedText: string) => {
    addAttachment(selectedText);
    openPanel();
    // Don't clear selection - user can continue highlighting more text
  };

  const handleDismiss = () => {
    window.getSelection()?.removeAllRanges();
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Enhanced Navigation with Auto-Hide */}
      <nav className={`fixed top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-transform duration-300 ease-in-out ${
        scrollDirection === 'down' ? '-translate-y-full' : 'translate-y-0'
      }`}>
        <div className="mx-auto max-w-4xl px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Home Icon */}
            <div className="flex-shrink-0">
              <a 
                href="#home" 
                aria-label="Home"
                className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <svg
                  className="h-5 w-5 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  role="img"
                >
                  <title>Home</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </a>
            </div>

            {/* Center: Project Title (interactive back to project) */}
            <div className="flex-1 text-center">
              <InteractiveHoverButton
                aria-label={`Back to ${episode.project.name}`}
                className="shadow-none hover:shadow-none focus:outline-none focus:ring-2 focus:ring-gray-300"
                hoverText="Back to Project"
                onClick={() => {
                  window.location.hash = '#project';
                  window.dispatchEvent(new CustomEvent('navigate:project'));
                }}
              >
                {episode.project.name}
              </InteractiveHoverButton>
            </div>

            {/* Right: Share Button */}
            <div className="flex-shrink-0 relative">
              <button type="button"
                onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
                aria-label="Share episode"
                className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <svg
                  className="h-5 w-5 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  role="img"
                >
                  <title>Share</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
              </button>
              
              <ShareMenu
                episode={episode}
                isOpen={isShareMenuOpen}
                onClose={() => setIsShareMenuOpen(false)}
              />
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-24 transition-all duration-300">
        <div className="max-w-3xl mx-auto px-8 py-16">
          {/* Episode Header */}
          <header className="mb-12 pb-8 text-center">
            <div className="mb-8">
              <div className="mb-6">
                <span className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                  Episode {episode.metadata.episodeNumber}
                </span>
              </div>
              <h1 className="text-5xl font-lora font-bold text-gray-900 mb-6 leading-tight [text-wrap:balance] max-w-[15ch] mx-auto">
                {episode.title}
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed font-light max-w-2xl mx-auto [text-wrap:balance]">
                {episode.subtitle}
              </p>
            </div>
            <div className="flex items-center justify-center text-sm text-gray-500 space-x-4 border-t border-gray-100 pt-6">
              <span>{formatDate(episode.metadata.publicationTimestamp)}</span>
            </div>
          </header>

          {/* Selectable Content Area */}
          <div ref={(el) => setContentElement(el)} id="episode-content">
            {/* Episode Content */}
            <main className="space-y-6">
              {episode.content
                .sort((a, b) => a.order - b.order)
                .map((contentBlock) => (
                  <ContentBlock
                    key={contentBlock.id}
                    block={contentBlock}
                  />
                ))}
            </main>

            {/* Research Planning Section */}
            <section className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {episode.researchPlanning.title}
              </h2>
              {episode.researchPlanning.paragraphs.map((paragraph, index) => (
                <div key={`${index}-${paragraph.slice(0,16)}`} className="text-gray-700 mb-4 leading-relaxed">
                  <ReactMarkdown>{paragraph}</ReactMarkdown>
                </div>
              ))}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800 font-medium">
                  {episode.researchPlanning.userPrompt}
                </p>
              </div>
            </section>
          </div>

          {/* Episode Footer: Send a quick signal */}
          <EpisodeFooterSignal
            directions={[
              'Client expectations',
              'Regulation reality',
              'Human‑AI design',
            ]}
            projectId={episode.project.id}
            episodeId={episode.id}
            onFocusChange={(focused) => {
              // Prevent selection clearing while interacting with the footer
              if (focused) return; // no-op; selection logic lives in hook
            }}
          />
        </div>

        {/* Highlight Toolbar */}
        {showToolbar && clientRect && text && (
          <HighlightToolbar
            clientRect={clientRect}
            selectedText={text}
            onAddToChat={handleAddToChat}
            onDismiss={handleDismiss}
          />
        )}

        {/* Floating Chat Toggle */}
        <FloatingChatToggle />
        
        {/* Chat Panel */}
        <ChatPanelNew />
        
        {/* Persistent Highlights */}
        <PersistentHighlight />
      </div>
    </div>
  );
}