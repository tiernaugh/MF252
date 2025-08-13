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
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <header className="border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-stone-900 mb-2">Your Projects</h1>
          <p className="text-base text-stone-600">Strategic intelligence tailored to your future</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 flex items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                placeholder="Search projects"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 border-stone-200 focus:border-stone-400 bg-white"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-md border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 bg-white"
            >
              <option value="lastPublished">Sort: Last published</option>
              <option value="nextEpisode">Sort: Next episode</option>
              <option value="az">Sort: A–Z</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/projects/new">
              <Button className="bg-stone-900 hover:bg-stone-800 text-white px-6">
                New project
              </Button>
            </Link>
            <div className="h-8 w-px bg-stone-200 mx-2" />
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
          <div className="text-center py-16">
            <p className="font-serif text-2xl text-stone-900 mb-4">No projects found</p>
            <p className="text-base text-stone-600 mb-6">Start exploring your strategic future</p>
            {query ? (
              <button
                onClick={() => setQuery('')}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Clear search
              </button>
            ) : (
              <Link href="/projects/new">
                <Button className="bg-stone-900 hover:bg-stone-800 text-white px-6 py-3">
                  Create your first project
                </Button>
              </Link>
            )}
          </div>
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
                  <Card className="h-full bg-white border border-stone-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer">
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
                      <div className="space-y-3">
                        <h3 className={`font-serif text-2xl font-semibold leading-tight line-clamp-2 ${
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
                      <div className={`mt-6 pt-6 border-t space-y-3 ${
                        project.isPaused ? 'border-stone-100' : 'border-stone-200'
                      }`}>
                        <div className={`flex items-center gap-4 text-xs uppercase tracking-wider ${
                          project.isPaused ? 'text-stone-400' : 'text-stone-500'
                        }`}>
                          <span>
                            {stats.publishedEpisodes} episodes
                          </span>
                          <span className="w-1 h-1 bg-stone-300 rounded-full" />
                          <span>
                            {project.cadenceType}
                          </span>
                          {!project.isPaused && project.nextScheduledAt && (
                            <>
                              <span className="w-1 h-1 bg-stone-300 rounded-full" />
                              <span className={`font-medium text-stone-700`}>
                                Next: {formatDate(project.nextScheduledAt)}
                              </span>
                            </>
                          )}
                          {project.isPaused && (
                            <>
                              <span className="w-1 h-1 bg-stone-300 rounded-full" />
                              <span className="text-stone-500">
                                Paused
                              </span>
                            </>
                          )}
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
          <div className="mt-12 pt-8 border-t border-stone-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-xs uppercase tracking-wider text-stone-500">
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