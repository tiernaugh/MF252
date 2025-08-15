import { getCurrentOrganization } from "~/server/actions/organizations";
import { getProjectsByOrg } from "~/server/actions/projects";
import { getEpisodesByProject } from "~/server/actions/episodes";
import ProjectsList from "./projects-list";

// Force dynamic rendering - don't try to statically generate at build time
export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  // Fetch real data from database
  const organization = await getCurrentOrganization();
  const projects = await getProjectsByOrg(organization.id);
  
  // Get episode counts for each project
  const episodeCounts: Record<string, number> = {};
  for (const project of projects) {
    const episodes = await getEpisodesByProject(project.id);
    const publishedCount = episodes.filter(e => e.status === "PUBLISHED").length;
    episodeCounts[project.id] = publishedCount;
  }
  
  // Pass data to client component for filtering/sorting
  return <ProjectsList initialProjects={projects} episodeCounts={episodeCounts} />;
}