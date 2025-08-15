import { notFound } from "next/navigation";
import { getEpisodeById } from "~/server/actions/episodes";
import { getProjectById } from "~/server/actions/projects";
import EpisodeReaderClient from "./episode-reader-client";

export default async function EpisodePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Unwrap params promise (Next.js 15 pattern)
  const { id } = await params;
  
  // Fetch episode from database
  const episode = await getEpisodeById(id);
  
  if (!episode) {
    notFound();
  }

  // Fetch the project for navigation
  const project = await getProjectById(episode.projectId);

  return (
    <EpisodeReaderClient 
      episode={episode} 
      project={project}
    />
  );
}