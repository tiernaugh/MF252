import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { getProjectsByOrg, mockOrganization, getEpisodesByProject } from "~/lib/mock-data";
import { Plus, Calendar, Pause, Play } from "lucide-react";

export default function ProjectsPage() {
  const projects = getProjectsByOrg(mockOrganization.id);

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

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Projects</h1>
          <p className="text-stone-600 mt-1">
            Your strategic research projects and their upcoming episodes
          </p>
        </div>
        <Link href="/projects/new">
          <Button className="bg-stone-900 hover:bg-stone-800">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-stone-600 mb-4">No projects yet</p>
            <Link href="/projects/new">
              <Button variant="outline">Create your first project</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const stats = getProjectStats(project.id);
            
            return (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg line-clamp-2">
                      {project.title}
                    </CardTitle>
                    {project.isPaused ? (
                      <Badge variant="secondary" className="ml-2">
                        <Pause className="w-3 h-3 mr-1" />
                        Paused
                      </Badge>
                    ) : (
                      <Badge className="ml-2 bg-green-100 text-green-800">
                        <Play className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {project.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Episode stats */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-stone-600">Episodes</span>
                      <span className="font-medium">
                        {stats.publishedEpisodes} published
                        {stats.totalEpisodes > stats.publishedEpisodes && 
                          ` (${stats.totalEpisodes - stats.publishedEpisodes} draft)`}
                      </span>
                    </div>

                    {/* Cadence */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-stone-600">Cadence</span>
                      <span className="font-medium capitalize">
                        {project.cadenceType.toLowerCase()}
                      </span>
                    </div>

                    {/* Next episode */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-stone-600 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Next episode
                      </span>
                      <span className="font-medium">
                        {project.isPaused ? "Paused" : formatDate(project.nextScheduledAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-4 border-t flex justify-between">
                    <Link 
                      href={`/projects/${project.id}`}
                      className="text-sm text-stone-600 hover:text-stone-900"
                    >
                      View details →
                    </Link>
                    {stats.publishedEpisodes > 0 && (
                      <Link 
                        href={`/projects/${project.id}/episodes`}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Read episodes →
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary stats */}
      {projects.length > 0 && (
        <div className="mt-8 p-4 bg-stone-100 rounded-lg">
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
  );
}