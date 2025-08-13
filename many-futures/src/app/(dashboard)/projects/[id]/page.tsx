"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Calendar, 
  Clock, 
  FileText,
  Settings,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { 
  mockProjects, 
  getEpisodesByProject,
  type Project,
  type Episode 
} from "~/lib/mock-data";

export default function ProjectDetailPage() {
  const params = useParams();
  const project = mockProjects.find(p => p.id === params.id);
  const episodes = getEpisodesByProject(params.id as string);
  
  const [isPausing, setIsPausing] = useState(false);

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

  const getProjectInitials = (title: string) => {
    return title
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handlePauseToggle = async () => {
    setIsPausing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    // In real app, would update via API
    project.isPaused = !project.isPaused;
    setIsPausing(false);
  };

  const publishedEpisodes = episodes.filter(e => e.status === "PUBLISHED");
  const draftEpisodes = episodes.filter(e => e.status === "DRAFT");

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
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
              <div className="flex items-center space-x-4">
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold ${
                    project.isPaused 
                      ? 'bg-stone-100 text-stone-500 border border-stone-300' 
                      : 'bg-gradient-to-br from-stone-100 to-stone-200 text-stone-700 border border-stone-300'
                  }`}
                >
                  {getProjectInitials(project.title)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-stone-900">{project.title}</h1>
                  <p className="text-stone-600 mt-1">{project.description}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handlePauseToggle}
                disabled={isPausing}
                className="border-stone-300"
              >
                {project.isPaused ? (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>
              <Button variant="outline" className="border-stone-300">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Episodes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Published Episodes */}
            {publishedEpisodes.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-stone-900 mb-4">
                  Published Episodes
                </h2>
                <div className="space-y-4">
                  {publishedEpisodes.map((episode) => (
                    <Link 
                      key={episode.id}
                      href={`/episodes/${episode.id}`}
                      className="block"
                    >
                      <Card className="bg-white border-stone-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge variant="secondary" className="bg-stone-100 text-stone-600">
                                  Episode {episode.sequence}
                                </Badge>
                                <span className="text-sm text-stone-500">
                                  {formatDate(episode.publishedAt)}
                                </span>
                                <span className="text-sm text-stone-500">
                                  • {episode.readingMinutes} min read
                                </span>
                              </div>
                              <h3 className="text-lg font-semibold text-stone-900 mb-2">
                                {episode.title}
                              </h3>
                              <p className="text-stone-600 line-clamp-2">
                                {episode.summary}
                              </p>
                              {episode.highlightQuote && (
                                <blockquote className="mt-3 pl-4 border-l-2 border-stone-300 text-stone-700 italic">
                                  "{episode.highlightQuote}"
                                </blockquote>
                              )}
                              {episode.sources && episode.sources.length > 0 && (
                                <div className="mt-3 flex items-center text-sm text-stone-500">
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  {episode.sources.length} sources cited
                                </div>
                              )}
                            </div>
                            <ChevronRight className="w-5 h-5 text-stone-400 ml-4 flex-shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Draft Episodes */}
            {draftEpisodes.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-stone-900 mb-4">
                  Upcoming Episodes
                </h2>
                <div className="space-y-4">
                  {draftEpisodes.map((episode) => (
                    <Card key={episode.id} className="bg-white border-stone-200 opacity-60">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline" className="border-stone-300 text-stone-500">
                            Draft
                          </Badge>
                          <span className="text-sm text-stone-500">
                            Episode {episode.sequence}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-stone-700 mb-2">
                          {episode.title}
                        </h3>
                        <p className="text-stone-500 line-clamp-2">
                          {episode.summary}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {episodes.length === 0 && (
              <Card className="bg-white border-stone-200">
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-stone-900 mb-2">
                    No episodes yet
                  </h3>
                  <p className="text-stone-600">
                    {project.isPaused 
                      ? "Resume this project to start generating episodes"
                      : "Your first episode will be generated soon"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Project Info */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="bg-white border-stone-200">
              <CardHeader>
                <CardTitle className="text-base">Project Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-600">Status</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      project.isPaused ? 'bg-stone-300' : 'bg-green-500'
                    }`} />
                    <span className="text-sm font-medium">
                      {project.isPaused ? 'Paused' : 'Active'}
                    </span>
                  </div>
                </div>
                
                <Separator className="bg-stone-100" />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-600">Cadence</span>
                  <span className="text-sm font-medium capitalize">
                    {project.cadenceType.toLowerCase()}
                  </span>
                </div>
                
                <Separator className="bg-stone-100" />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-600">Next Episode</span>
                  <span className="text-sm font-medium">
                    {project.isPaused ? "Paused" : formatDate(project.nextScheduledAt)}
                  </span>
                </div>
                
                {project.lastPublishedAt && (
                  <>
                    <Separator className="bg-stone-100" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-stone-600">Last Published</span>
                      <span className="text-sm font-medium">
                        {formatDate(project.lastPublishedAt)}
                      </span>
                    </div>
                  </>
                )}
                
                <Separator className="bg-stone-100" />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-600">Total Episodes</span>
                  <span className="text-sm font-medium">
                    {publishedEpisodes.length} published
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Project Brief */}
            {project.onboardingBrief && (
              <Card className="bg-white border-stone-200">
                <CardHeader>
                  <CardTitle className="text-base">Project Brief</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-stone-700 mb-2">Context</h4>
                    <p className="text-sm text-stone-600">
                      {project.onboardingBrief.context}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-stone-700 mb-2">Focus Areas</h4>
                    <ul className="text-sm text-stone-600 space-y-1">
                      {project.onboardingBrief.focusAreas.map((area, i) => (
                        <li key={i}>• {area}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-stone-700 mb-2">Preferences</h4>
                    <div className="space-y-1">
                      <p className="text-sm text-stone-600">
                        <span className="font-medium">Tone:</span> {project.onboardingBrief.preferences.tone}
                      </p>
                      <p className="text-sm text-stone-600">
                        <span className="font-medium">Speculation:</span> {project.onboardingBrief.preferences.speculationLevel}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}