"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Home, Share2, Star } from "lucide-react";
import type { Episode, Project } from "~/lib/mock-data";

interface EpisodeReaderClientProps {
  episode: Episode;
  project: Project | null;
}

export default function EpisodeReaderClient({ episode, project }: EpisodeReaderClientProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: episode.title,
          text: episode.summary,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleFeedback = () => {
    console.log('Feedback submitted:', { rating, text: feedbackText });
    setFeedbackSubmitted(true);
    // In production, this would save to database
  };

  // Render markdown-like content as HTML
  const renderContent = (content: string) => {
    const paragraphs = content.split('\n\n');
    
    return paragraphs.map((paragraph, i) => {
      // Check for headers
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
            {project && (
              <Link 
                href={`/projects/${project.id}`}
                className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
              >
                {project.title}
              </Link>
            )}
            
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
            
            {/* Metadata */}
            <div className="flex items-center justify-center gap-6 text-sm text-stone-500">
              <span>{formatDate(episode.publishedAt)}</span>
              <span className="w-1 h-1 bg-stone-300 rounded-full" />
              <span>{episode.readingMinutes} min read</span>
              {episode.sources && episode.sources.length > 0 && (
                <>
                  <span className="w-1 h-1 bg-stone-300 rounded-full" />
                  <span>{episode.sources.length} sources</span>
                </>
              )}
            </div>
          </header>

          {/* Episode Content - Editorial Typography */}
          <div className="prose prose-lg prose-stone max-w-none">
            {renderContent(episode.content)}
          </div>

          {/* Sources Section */}
          {episode.sources && episode.sources.length > 0 && (
            <section className="mt-16 pt-8 border-t border-stone-200">
              <h3 className="text-xl font-semibold text-stone-900 mb-6">Sources & References</h3>
              <ul className="space-y-4">
                {episode.sources.map((source, i) => (
                  <li key={i} className="flex flex-col">
                    <a 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline underline-offset-2"
                    >
                      {source.title}
                    </a>
                    {source.publicationDate && (
                      <span className="text-sm text-stone-500 mt-1">
                        Published: {source.publicationDate}
                      </span>
                    )}
                    {source.excerpt && (
                      <blockquote className="mt-2 pl-4 border-l-2 border-stone-200 text-stone-600 italic">
                        "{source.excerpt}"
                      </blockquote>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Research Prompt for Next Episode */}
          {episode.researchPrompt && (
            <section className="mt-16 p-8 bg-stone-50 rounded-lg">
              <h3 className="text-xl font-semibold text-stone-900 mb-4">Shape the Next Episode</h3>
              <p className="text-stone-700 mb-4">
                We're exploring: <span className="font-medium">{episode.researchPrompt}</span>
              </p>
              <p className="text-sm text-stone-600">
                Your feedback helps shape what we research next.
              </p>
            </section>
          )}

          {/* Feedback Section */}
          <section className="mt-16 pt-8 border-t border-stone-200">
            <h3 className="text-xl font-semibold text-stone-900 mb-6">How was this episode?</h3>
            
            {!feedbackSubmitted ? (
              <div className="space-y-6">
                {/* Star Rating */}
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`p-2 rounded-lg transition-colors ${
                        rating && rating >= star 
                          ? 'text-yellow-500' 
                          : 'text-stone-300 hover:text-stone-400'
                      }`}
                    >
                      <Star className={`w-6 h-6 ${rating && rating >= star ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
                
                {/* Text Feedback */}
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="What would you like to see in future episodes? (Optional)"
                  className="w-full p-4 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
                  rows={3}
                />
                
                {/* Submit Button */}
                <Button 
                  onClick={handleFeedback}
                  disabled={!rating}
                  className="bg-stone-900 hover:bg-stone-800 text-white"
                >
                  Submit Feedback
                </Button>
              </div>
            ) : (
              <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">Thank you for your feedback!</p>
                <p className="text-green-700 text-sm mt-1">
                  Your input helps shape future episodes.
                </p>
              </div>
            )}
          </section>

          {/* Navigation Footer */}
          <footer className="mt-16 pt-8 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <Link 
                href={`/projects/${episode.projectId}`}
                className="text-blue-600 hover:text-blue-700"
              >
                ← Back to project
              </Link>
              <Link 
                href="/projects"
                className="text-blue-600 hover:text-blue-700"
              >
                All projects →
              </Link>
            </div>
          </footer>
        </div>
      </article>
    </div>
  );
}