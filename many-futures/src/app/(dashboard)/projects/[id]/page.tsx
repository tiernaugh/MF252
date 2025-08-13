"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { 
  ArrowLeft, 
  Settings,
  ChevronRight,
  ExternalLink,
  Search
} from "lucide-react";
import { 
  mockProjects, 
  getEpisodesByProject,
  getUpcomingEpisode,
  type Project,
  type Episode,
  type UpcomingEpisode 
} from "~/lib/mock-data";

export default function ProjectDetailPage() {
  const params = useParams();
  const project = mockProjects.find(p => p.id === params.id);
  const episodes = getEpisodesByProject(params.id as string);
  const upcoming = getUpcomingEpisode(params.id as string);
  
  const [searchQuery, setSearchQuery] = useState("");

  if (!project) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Project not found</h1>
          <Link href="/projects" className="text-blue-600 hover:text-blue-700">
            ← Back to projects
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "Not scheduled";
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  const getDayOfWeek = (date: Date) => {
    return date.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase();
  };

  const getProjectInitials = (title: string) => {
    return title
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Calculate time until influence deadline
  const getInfluenceTime = (deadline?: Date) => {
    if (!deadline) return null;
    const now = new Date();
    const hours = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
    if (hours <= 0) return null;
    return `${hours} hours`;
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
    <div className="min-h-screen bg-stone-50">
      {/* Minimal Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/projects"
                className="text-stone-600 hover:text-stone-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center space-x-3">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${ 
                    project.isPaused 
                      ? 'bg-stone-100 text-stone-500 border border-stone-300' 
                      : 'bg-gradient-to-br from-stone-100 to-stone-200 text-stone-700 border border-stone-300'
                  }`}
                >
                  {getProjectInitials(project.title)}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-stone-900">{project.title}</h1>
                  <p className="text-xs uppercase tracking-wider text-stone-500 mt-0.5">
                    {project.cadenceType} INTELLIGENCE • {publishedEpisodes.length} EPISODES • {project.isPaused ? 'PAUSED' : 'ACTIVE'}
                  </p>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-stone-600">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Episode Section */}
        {latestEpisode && (
          <article className="mb-16 animate-fade-in">
            {/* Episode Metadata */}
            <div className="flex items-center gap-4 mb-8">
              <span className="text-xs uppercase tracking-wider text-stone-500 font-medium">
                Episode {latestEpisode.sequence}
              </span>
              <span className="w-1 h-1 bg-stone-300 rounded-full" />
              <span className="text-xs uppercase tracking-wider text-stone-500">
                {latestEpisode.readingMinutes} min read
              </span>
              {isNew(latestEpisode) && (
                <>
                  <span className="w-1 h-1 bg-stone-300 rounded-full" />
                  <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">NEW</Badge>
                </>
              )}
            </div>

            {/* Hero Title - Editorial Style */}
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 leading-tight mb-6 max-w-4xl">
              {latestEpisode.title}
            </h2>

            {/* Pull Quote - Visual Interest */}
            {latestEpisode.highlightQuote && (
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-stone-50 to-transparent rounded-lg opacity-50" />
                <blockquote className="relative border-l-4 border-stone-900 pl-6 py-4">
                  <p className="text-xl md:text-2xl font-serif italic text-stone-800 leading-relaxed">
                    "{latestEpisode.highlightQuote}"
                  </p>
                </blockquote>
              </div>
            )}

            {/* Episode Summary */}
            <p className="text-lg text-stone-600 leading-relaxed mb-6 max-w-3xl">
              {latestEpisode.summary}
            </p>

            {/* Sources Count */}
            {latestEpisode.sources && latestEpisode.sources.length > 0 && (
              <div className="flex items-center text-sm text-stone-500 mb-8">
                <ExternalLink className="w-3 h-3 mr-1.5" />
                {latestEpisode.sources.length} sources cited
              </div>
            )}

            {/* CTA Button */}
            <Link href={`/episodes/${latestEpisode.id}`}>
              <Button 
                size="lg"
                className="bg-stone-900 hover:bg-stone-800 text-white font-medium px-6 py-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              >
                Read episode
                <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
              </Button>
            </Link>
          </article>
        )}

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent mb-12" />

        {/* Upcoming Episode Preview */}
        {upcoming && upcoming.status === 'scheduled' && (
          <section className="mb-16 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-xs uppercase tracking-wider text-stone-500 font-medium mb-6">
              COMING {getDayOfWeek(upcoming.scheduledAt)}
            </h3>
            
            {upcoming.previewQuestions && upcoming.previewQuestions.length > 0 && (
              <div className="space-y-4 mb-6">
                {upcoming.previewQuestions.map((question, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-stone-400 mt-0.5">→</span>
                    <p className="text-base text-stone-700 leading-relaxed">{question}</p>
                  </div>
                ))}
              </div>
            )}
            
            {upcoming.influenceDeadline && getInfluenceTime(upcoming.influenceDeadline) && (
              <p className="text-sm text-stone-500">
                You can influence this episode for another {getInfluenceTime(upcoming.influenceDeadline)}
              </p>
            )}
          </section>
        )}

        {/* Previous Episodes */}
        {previousEpisodes.length > 0 && (
          <>
            <div className="h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent mb-12" />
            
            <section className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs uppercase tracking-wider text-stone-500 font-medium">
                  PREVIOUS EPISODES
                </h3>
              </div>
              
              {/* Search Bar */}
              <div className="relative mb-8">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search episodes..."
                  className="pl-10 bg-white border-stone-200 focus:border-stone-400 transition-colors"
                />
              </div>
              
              {/* Episode List */}
              {filteredPrevious.length === 0 ? (
                <p className="text-sm text-stone-500">
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
                      <Card className="bg-white border-stone-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary" className="bg-stone-100 text-stone-600 text-xs">
                                  Episode {episode.sequence}
                                </Badge>
                                {isNew(episode) && (
                                  <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">NEW</Badge>
                                )}
                              </div>
                              <h4 className="font-semibold text-stone-900 group-hover:text-stone-700 transition-colors mb-2">
                                {episode.title}
                              </h4>
                              <p className="text-sm text-stone-600 line-clamp-2 mb-3">
                                {episode.summary}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-stone-500">
                                <span>{formatDate(episode.publishedAt)}</span>
                                <span>•</span>
                                <span>{episode.readingMinutes} min read</span>
                                {episode.sources && episode.sources.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center">
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
          </>
        )}
      </div>
    </div>
  );
}