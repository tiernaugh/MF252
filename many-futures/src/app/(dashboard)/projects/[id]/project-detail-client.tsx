"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { 
  Home,
  Settings,
  ChevronRight,
  ExternalLink,
  Search
} from "lucide-react";
import type { Project, Episode, UpcomingEpisode } from "~/lib/mock-data";

interface ProjectDetailClientProps {
  project: Project;
  episodes: Episode[];
  upcoming: UpcomingEpisode | null;
}

export default function ProjectDetailClient({ 
  project, 
  episodes,
  upcoming 
}: ProjectDetailClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
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

  // Dynamic date formatting (Today, Yesterday, X days ago)
  const formatDynamicDate = (date: Date | null): string => {
    if (!date) return "Not scheduled";
    
    const now = new Date();
    const dateToFormat = new Date(date);
    
    // Reset times to midnight for accurate day comparison
    now.setHours(0, 0, 0, 0);
    dateToFormat.setHours(0, 0, 0, 0);
    
    const diffTime = now.getTime() - dateToFormat.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays > 1 && diffDays <= 7) {
      return `${diffDays} days ago`;
    } else {
      // For older dates, show the full date
      return date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short',
        year: 'numeric'
      });
    }
  };

  const getDayOfWeek = (date: Date) => {
    return date.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase();
  };

  // Separate and filter episodes
  const publishedEpisodes = episodes.filter(e => e.status === "PUBLISHED");
  const latestEpisode = publishedEpisodes[0];
  const previousEpisodes = publishedEpisodes.slice(1);
  
  // Search filter for previous episodes
  const filteredPrevious = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return previousEpisodes;
    return previousEpisodes.filter(e => 
      e.title.toLowerCase().includes(query) || 
      e.summary.toLowerCase().includes(query)
    );
  }, [searchQuery, previousEpisodes]);

  // Activity tracking (would come from localStorage in production)
  const isNew = (episode: Episode) => {
    if (!episode.publishedAt) return false;
    const daysSincePublish = Math.floor(
      (new Date().getTime() - episode.publishedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSincePublish <= 7;
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
            <span className="text-sm text-stone-600">
              {project.title}
            </span>
            
            {/* Settings Icon */}
            <Link
              href={`/projects/${project.id}/settings`}
              className="p-2 rounded-lg hover:bg-stone-50 transition-colors"
              aria-label="Project settings"
            >
              <Settings className="w-5 h-5 text-stone-600" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24">
        {/* Zone 1: Editorial Hero - Centered */}
        {latestEpisode && (
          <section className="max-w-3xl mx-auto px-8 py-16 text-center">
            {/* Episode Number - More subtle, integrated */}
            <div className="text-xs uppercase tracking-wider text-stone-500 mb-6">
              Episode {latestEpisode.sequence}
            </div>
            
            {/* Hero Title - Large Serif, Centered */}
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-stone-900 mb-8 leading-tight max-w-[20ch] mx-auto" 
                style={{ textWrap: 'balance' as any }}>
              {latestEpisode.title}
            </h2>
            
            {/* Pull Quote - Visual Interest */}
            {latestEpisode.highlightQuote && (
              <blockquote className="my-10 py-6 border-t border-b border-stone-200">
                <p className="text-2xl font-serif italic text-stone-700 leading-relaxed">
                  "{latestEpisode.highlightQuote}"
                </p>
              </blockquote>
            )}
            
            {/* Summary */}
            <p className="text-lg text-stone-600 leading-relaxed mb-8 max-w-2xl mx-auto">
              {latestEpisode.summary}
            </p>
            
            {/* Metadata - Date more prominent */}
            <div className="mb-10">
              {/* Publication date - larger and more prominent */}
              <div className="text-base text-stone-700 font-medium mb-3">
                {formatDynamicDate(latestEpisode.publishedAt)}
                {isNew(latestEpisode) && (
                  <Badge className="ml-2 bg-blue-100 text-blue-700 border-0 text-xs uppercase tracking-wider">NEW</Badge>
                )}
              </div>
              
              {/* Secondary metadata */}
              <div className="flex items-center justify-center gap-4 text-sm text-stone-500">
                <span>{latestEpisode.readingMinutes} min read</span>
                {latestEpisode.sources && latestEpisode.sources.length > 0 && (
                  <>
                    <span className="w-1 h-1 bg-stone-300 rounded-full" />
                    <span className="flex items-center">
                      <ExternalLink className="w-3 h-3 mr-1.5" />
                      {latestEpisode.sources.length} sources
                    </span>
                  </>
                )}
              </div>
            </div>
            
            {/* CTA Button */}
            <Link href={`/episodes/${latestEpisode.id}`}>
              <Button 
                size="lg"
                className="bg-stone-900 hover:bg-stone-800 text-white font-medium px-6 py-3 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                Read Episode →
              </Button>
            </Link>
          </section>
        )}

        {/* No Episodes State */}
        {publishedEpisodes.length === 0 && (
          <section className="max-w-3xl mx-auto px-8 py-16 text-center">
            <h2 className="font-serif text-3xl font-bold text-stone-900 mb-4">
              Your first episode is coming soon
            </h2>
            <p className="text-lg text-stone-600 mb-8">
              {project.nextScheduledAt 
                ? `Scheduled for ${formatDynamicDate(project.nextScheduledAt)}`
                : "Episode generation will begin shortly"}
            </p>
          </section>
        )}

        {/* Upcoming Episode Preview - More editorial */}
        {upcoming && upcoming.status === 'scheduled' && (
          <section className="max-w-3xl mx-auto px-8 py-12 border-t border-stone-200">
            {/* Editorial header */}
            <div className="text-center mb-8">
              <div className="text-xs uppercase tracking-wider text-stone-500 mb-2">
                Next Episode
              </div>
              <h3 className="font-serif text-2xl font-semibold text-stone-900">
                Research in Progress
              </h3>
              <p className="text-sm text-stone-600 mt-2">
                Publishing {getDayOfWeek(upcoming.scheduledAt).charAt(0) + getDayOfWeek(upcoming.scheduledAt).slice(1).toLowerCase()}
              </p>
            </div>
            
            {/* Research questions as editorial teasers */}
            {upcoming.previewQuestions && upcoming.previewQuestions.length > 0 && (
              <div className="space-y-3 max-w-2xl mx-auto">
                <p className="text-xs uppercase tracking-wider text-stone-500 text-center mb-4">
                  Exploring
                </p>
                {upcoming.previewQuestions.map((question, i) => (
                  <div key={i} className="pl-4 border-l-2 border-stone-200">
                    <p className="text-base text-stone-700 leading-relaxed italic">
                      {question}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Zone 2: Functional List - Previous Episodes */}
        {previousEpisodes.length > 0 && (
          <section className="max-w-6xl mx-auto px-6 py-12 border-t border-stone-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-serif text-2xl md:text-3xl font-semibold text-stone-900">
                Previous Episodes
              </h3>
            </div>
            
            {/* Search Bar */}
            <div className="relative mb-8 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search episodes..."
                className="pl-10 bg-white border-stone-200 focus:border-stone-400 transition-colors"
              />
            </div>
            
            {/* Episode List with serif titles */}
            {filteredPrevious.length === 0 ? (
              <p className="text-base text-stone-500">
                {searchQuery ? "No matches found." : "No previous episodes."}
              </p>
            ) : (
              <div className="space-y-4">
                {filteredPrevious.map((episode) => (
                  <Link
                    key={episode.id}
                    href={`/episodes/${episode.id}`}
                    className="block"
                  >
                    <Card className="bg-white border border-stone-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                      <CardContent className="p-8">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-xs uppercase tracking-wider text-stone-500">
                                Episode {episode.sequence}
                              </span>
                              {isNew(episode) && (
                                <Badge className="bg-blue-100 text-blue-700 border-0 text-xs uppercase tracking-wider">NEW</Badge>
                              )}
                            </div>
                            <h4 className="font-serif text-2xl font-semibold text-stone-900 group-hover:text-stone-700 transition-colors mb-3">
                              {episode.title}
                            </h4>
                            <p className="text-base text-stone-600 line-clamp-2 mb-4 leading-relaxed">
                              {episode.summary}
                            </p>
                            <div className="flex items-center gap-4 text-xs uppercase tracking-wider text-stone-500">
                              <span>{formatDynamicDate(episode.publishedAt)}</span>
                              <span className="w-1 h-1 bg-stone-300 rounded-full" />
                              <span>{episode.readingMinutes} min read</span>
                              {episode.sources && episode.sources.length > 0 && (
                                <>
                                  <span className="w-1 h-1 bg-stone-300 rounded-full" />
                                  <span className="flex items-center normal-case tracking-normal">
                                    <ExternalLink className="w-3 h-3 mr-1" />
                                    {episode.sources.length} sources
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-stone-600 transition-colors ml-4 flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}