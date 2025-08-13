"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { getProjectsByOrg, mockOrganization, getEpisodesByProject } from "~/lib/mock-data";
import { Search } from "lucide-react";

type SortKey = 'lastPublished' | 'az' | 'nextEpisode';
type StatusFilter = 'all' | 'active' | 'paused';

export default function ProjectsPage() {
  const projects = getProjectsByOrg(mockOrganization.id);
  
  // Local UI state
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('lastPublished');
  const [status, setStatus] = useState<StatusFilter>('all');

  const filtered = useMemo(() => {
    let items = projects;
    
    // Filter by status
    if (status !== 'all') {
      items = items.filter((p) => (status === 'paused' ? p.isPaused : !p.isPaused));
    }
    
    // Filter by search query
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      items = items.filter((p) => 
        p.title.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q)
      );
    }
    
    // Sort
    if (sort === 'az') {
      items = [...items].sort((a, b) => {
        // Always show active projects first
        if (a.isPaused !== b.isPaused) {
          return a.isPaused ? 1 : -1;
        }
        return a.title.localeCompare(b.title);
      });
    } else if (sort === 'nextEpisode') {
      items = [...items].sort((a, b) => {
        // Always show active projects first
        if (a.isPaused !== b.isPaused) {
          return a.isPaused ? 1 : -1;
        }
        if (!a.nextScheduledAt) return 1;
        if (!b.nextScheduledAt) return -1;
        return a.nextScheduledAt.getTime() - b.nextScheduledAt.getTime();
      });
    } else {
      // 'lastPublished'
      items = [...items].sort((a, b) => {
        // Always show active projects first
        if (a.isPaused !== b.isPaused) {
          return a.isPaused ? 1 : -1;
        }
        if (!a.lastPublishedAt) return 1;
        if (!b.lastPublishedAt) return -1;
        return b.lastPublishedAt.getTime() - a.lastPublishedAt.getTime();
      });
    }
    
    return items;
  }, [projects, query, sort, status]);

  const formatDate = (date: Date | null) => {
    if (!date) return "Not scheduled";
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  const getProjectStats = (projectId: string) => {
    const episodes = getEpisodesByProject(projectId);
    const publishedCount = episodes.filter(e => e.status === "PUBLISHED").length;
    return {
      totalEpisodes: episodes.length,
      publishedEpisodes: publishedCount
    };
  };

  const getProjectInitials = (title: string) => {
    return title
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Projects</h1>
          <Link href="/projects/new">
            <Button className="bg-stone-900 hover:bg-stone-800 text-white">
              New project
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 flex items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Search projects"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 border-stone-200 focus:border-stone-400"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-md border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300"
            >
              <option value="lastPublished">Sort: Last published</option>
              <option value="nextEpisode">Sort: Next episode</option>
              <option value="az">Sort: A–Z</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'active', 'paused'] as StatusFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setStatus(f)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  status === f 
                    ? 'border-stone-900 text-stone-900 bg-stone-100' 
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Paused'}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        {filtered.length === 0 ? (
          <Card className="border-dashed border-stone-300 bg-white">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-stone-600 mb-2">No projects found</p>
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-sm text-stone-500 hover:text-stone-700 underline"
                >
                  Clear search
                </button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filtered.map((project) => {
              const stats = getProjectStats(project.id);
              
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group"
                >
                  <Card className="h-full bg-white border-stone-200 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer">
                    <CardContent className="p-8">
                      {/* Project Avatar & Status */}
                      <div className="flex items-start justify-between mb-6">
                        <div 
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold ${
                            project.isPaused 
                              ? 'bg-stone-100 text-stone-500 border border-stone-300' 
                              : 'bg-gradient-to-br from-stone-100 to-stone-200 text-stone-700 border border-stone-300'
                          }`}
                        >
                          {getProjectInitials(project.title)}
                        </div>
                        <div 
                          className={`w-3 h-3 rounded-full ${
                            project.isPaused ? 'bg-stone-300' : 'bg-green-500'
                          }`}
                          title={project.isPaused ? 'Paused' : 'Active'}
                        />
                      </div>

                      {/* Content */}
                      <div className="space-y-4">
                        <h3 className={`text-xl font-bold leading-tight line-clamp-2 ${
                          project.isPaused ? 'text-stone-700' : 'text-stone-900'
                        }`}>
                          {project.title}
                        </h3>
                        <p className={`text-base leading-relaxed line-clamp-2 ${
                          project.isPaused ? 'text-stone-500' : 'text-stone-600'
                        }`}>
                          {project.description}
                        </p>
                      </div>

                      {/* Metadata */}
                      <div className={`mt-6 pt-6 border-t space-y-2 ${
                        project.isPaused ? 'border-stone-100' : 'border-stone-150'
                      }`}>
                        {/* Next Episode (Primary) */}
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${
                            project.isPaused ? 'text-stone-400' : 'text-stone-500'
                          }`}>
                            Next episode
                          </span>
                          <span className={`text-sm font-medium ${
                            project.isPaused ? 'text-stone-500' : 'text-stone-700'
                          }`}>
                            {project.isPaused ? "Paused" : formatDate(project.nextScheduledAt)}
                          </span>
                        </div>
                        
                        {/* Last Published (Secondary) */}
                        {project.lastPublishedAt && (
                          <div className="flex items-center justify-between">
                            <span className={`text-sm ${
                              project.isPaused ? 'text-stone-400' : 'text-stone-500'
                            }`}>
                              Last published
                            </span>
                            <span className={`text-sm ${
                              project.isPaused ? 'text-stone-400' : 'text-stone-500'
                            }`}>
                              {formatDate(project.lastPublishedAt)}
                            </span>
                          </div>
                        )}
                        
                        {/* Episodes Count */}
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${
                            project.isPaused ? 'text-stone-400' : 'text-stone-500'
                          }`}>
                            Episodes
                          </span>
                          <span className={`text-sm font-medium ${
                            project.isPaused ? 'text-stone-500' : 'text-stone-600'
                          }`}>
                            {stats.publishedEpisodes} published
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Summary Footer */}
        {projects.length > 0 && (
          <div className="mt-8 p-4 bg-white rounded-lg border border-stone-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-600">
                {projects.length} project{projects.length !== 1 ? 's' : ''} • 
                {' '}{projects.filter(p => !p.isPaused).length} active
              </span>
              <Link 
                href="/projects/new"
                className="text-blue-600 hover:text-blue-700"
              >
                Create another project →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}