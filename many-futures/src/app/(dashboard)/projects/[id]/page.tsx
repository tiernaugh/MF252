import { notFound } from "next/navigation";
import { getProjectById } from "~/server/actions/projects";
import { getEpisodesByProject } from "~/server/actions/episodes";
import ProjectDetailClient from "./project-detail-client";
import type { UpcomingEpisode } from "~/lib/mock-data";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Unwrap params promise (Next.js 15 pattern)
  const { id } = await params;
  
  // Fetch project from database
  const project = await getProjectById(id);
  
  if (!project) {
    notFound();
  }
  
  // Fetch episodes from database
  const episodes = await getEpisodesByProject(id);
  
  // Generate upcoming episode info (for MVP, mock this)
  // In production, this would come from the EpisodeScheduleQueue table
  const upcoming: UpcomingEpisode | null = project.nextScheduledAt && !project.isPaused
    ? {
        projectId: project.id,
        status: 'scheduled' as const,
        scheduledAt: project.nextScheduledAt,
        influenceDeadline: new Date(project.nextScheduledAt.getTime() - 24 * 60 * 60 * 1000),
        previewQuestions: [
          "What emerging trends should we be tracking?",
          "How will recent developments impact the landscape?",
          "What scenarios should we prepare for?"
        ]
      }
    : null;
  
  return (
    <ProjectDetailClient 
      project={project} 
      episodes={episodes}
      upcoming={upcoming}
    />
  );
}