"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { mockEpisodes, mockProjects } from "~/lib/mock-data";
import { Button } from "~/components/ui/button";
import { Home, Share2, Star } from "lucide-react";
import { notFound } from "next/navigation";

export default function EpisodePage({ params }: { params: Promise<{ id: string }> }) {
  const [rating, setRating] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Unwrap params promise with React.use()
  const { id } = use(params);
  
  const episode = mockEpisodes.find(e => e.id === id);
  
  if (!episode) {
    notFound();
  }

  const project = mockProjects.find(p => p.id === episode.projectId);

  // Auto-hide navigation on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show nav when scrolling up or at top
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsNavVisible(true);
      } 
      // Hide nav when scrolling down
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsNavVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  const handleSubmitFeedback = () => {
    console.log("Feedback submitted:", { rating, feedbackText });
    setFeedbackSubmitted(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: episode.title,
          text: episode.summary,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled or failed");
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  // Simple markdown to HTML conversion
  const renderContent = (content: string) => {
    // Convert markdown links to HTML
    const withLinks = content.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline underline-offset-2 hover:text-blue-800">$1</a>'
    );
    
    return withLinks.split('\n\n').map((paragraph, i) => {
      // Headers
      if (paragraph.startsWith('# ')) {
        return (
          <h1 key={i} className="text-3xl font-bold font-serif text-stone-900 mt-12 mb-6 first:mt-0">
            {paragraph.replace(/^# /, '')}
          </h1>
        );
      }
      if (paragraph.startsWith('## ')) {
        return (
          <h2 key={i} className="text-2xl font-semibold text-stone-900 mt-10 mb-4">
            {paragraph.replace(/^## /, '')}
          </h2>
        );
      }
      if (paragraph.startsWith('### ')) {
        return (
          <h3 key={i} className="text-xl font-semibold text-stone-900 mt-8 mb-3">
            {paragraph.replace(/^### /, '')}
          </h3>
        );
      }
      
      // Bold text
      const withBold = paragraph.replace(
        /\*\*([^*]+)\*\*/g,
        '<strong class="font-semibold">$1</strong>'
      );
      
      // Regular paragraphs
      if (paragraph.trim()) {
        return (
          <p 
            key={i} 
            className="text-lg leading-relaxed text-stone-700 mb-6"
            dangerouslySetInnerHTML={{ __html: withBold.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
              '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline underline-offset-2 hover:text-blue-800">$1</a>')
            }}
          />
        );
      }
      return null;
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Navigation with Auto-Hide */}
      <nav className={`fixed top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-b border-stone-100 transition-transform duration-300 ${
        isNavVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Home Icon */}
            <Link 
              href="/projects"
              className="p-2 rounded-lg hover:bg-stone-50 transition-colors"
              aria-label="Back to projects"
            >
              <Home className="w-5 h-5 text-stone-600" />
            </Link>
            
            {/* Project Name */}
            <Link 
              href={`/projects/${project?.id}`}
              className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              {project?.title}
            </Link>
            
            {/* Share Icon */}
            <button
              onClick={handleShare}
              className="p-2 rounded-lg hover:bg-stone-50 transition-colors"
              aria-label="Share episode"
            >
              <Share2 className="w-5 h-5 text-stone-600" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <article className="pt-24">
        <div className="max-w-3xl mx-auto px-8 py-16">
          {/* Hero Header - Editorial Style */}
          <header className="text-center mb-16">
            {/* Episode Badge */}
            <span className="inline-block px-4 py-2 bg-stone-100 text-stone-700 text-sm font-medium rounded-full mb-8">
              Episode {episode.sequence}
            </span>
            
            {/* Title - Large Serif */}
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-stone-900 mb-8 leading-tight max-w-[20ch] mx-auto" 
                style={{ textWrap: 'balance' as any }}>
              {episode.title}
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl text-stone-600 leading-relaxed font-light max-w-2xl mx-auto mb-8">
              {episode.summary}
            </p>
            
            {/* Pull Quote if exists */}
            {episode.highlightQuote && (
              <blockquote className="my-10 py-6 border-t border-b border-stone-200">
                <p className="text-2xl font-serif italic text-stone-700 leading-relaxed">
                  "{episode.highlightQuote}"
                </p>
              </blockquote>
            )}
            
            {/* Publication Info */}
            <div className="text-sm text-stone-500">
              {formatDate(episode.publishedAt)} · {episode.readingMinutes} min read
            </div>
          </header>

          {/* Episode Content with Typography */}
          <div className="prose prose-stone prose-lg max-w-none">
            <div className="space-y-2" style={{ fontFamily: 'Charter, Georgia, serif' }}>
              {renderContent(episode.content)}
            </div>
          </div>

          {/* Sources Section if they exist */}
          {episode.sources && episode.sources.length > 0 && (
            <div className="mt-16 pt-8 border-t border-stone-200">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Sources</h3>
              <div className="space-y-3">
                {episode.sources.map((source, i) => (
                  <div key={i} className="text-sm">
                    <a 
                      href={source.url !== '#' ? source.url : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-blue-600 ${source.url !== '#' ? 'underline hover:text-blue-800' : 'no-underline cursor-default'}`}
                    >
                      {source.title}
                    </a>
                    {source.publicationDate && (
                      <span className="text-stone-500 ml-2">({source.publicationDate})</span>
                    )}
                    {source.excerpt && (
                      <p className="text-stone-600 mt-1 italic">"{source.excerpt}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Simple Feedback Section */}
          <div className="mt-20 p-8 bg-stone-50 rounded-xl">
            {!feedbackSubmitted ? (
              <>
                <h3 className="text-lg font-semibold text-stone-900 mb-6">
                  How was this episode?
                </h3>
                
                {/* Star Rating */}
                <div className="flex gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => setRating(value)}
                      className={`p-3 rounded-lg border transition-all ${
                        rating && rating >= value
                          ? 'bg-stone-900 text-white border-stone-900' 
                          : 'bg-white border-stone-300 hover:border-stone-400 hover:bg-stone-50'
                      }`}
                    >
                      <Star className={`w-5 h-5 ${rating && rating >= value ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
                
                {/* Optional Feedback Text */}
                <textarea
                  placeholder="Any specific feedback? (optional)"
                  className="w-full p-4 border border-stone-300 rounded-lg mb-6 resize-none focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent"
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                />
                
                <Button 
                  onClick={handleSubmitFeedback}
                  disabled={!rating}
                  className="bg-stone-900 hover:bg-stone-800 text-white px-6 py-3"
                >
                  Submit Feedback
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-stone-700 font-medium mb-2">
                  Thanks for your feedback!
                </p>
                <p className="text-sm text-stone-500">
                  It helps us create better episodes for you.
                </p>
              </div>
            )}
          </div>

          {/* Next Episode Teaser */}
          {project && !project.isPaused && project.nextScheduledAt && (
            <div className="mt-12 pt-8 border-t border-stone-200">
              <p className="text-sm text-stone-600 text-center">
                Next episode arrives {formatDate(project.nextScheduledAt)}
              </p>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}