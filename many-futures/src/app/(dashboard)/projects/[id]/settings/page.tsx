import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getProjectById, updateProjectSettings, pauseProject, resumeProject } from "~/server/actions/projects";
import SettingsClient from "./settings-client";

export default async function ProjectSettingsPage({ 
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

  // Server actions for updating settings
  async function handleSave(settings: Parameters<typeof updateProjectSettings>[1]) {
    "use server";
    
    try {
      await updateProjectSettings(id, settings);
      revalidatePath(`/projects/${id}/settings`);
      revalidatePath(`/projects/${id}`);
      revalidatePath("/projects");
    } catch (error) {
      console.error("Failed to save settings:", error);
      throw error;
    }
  }

  async function handlePause() {
    "use server";
    
    try {
      await pauseProject(id);
      revalidatePath(`/projects/${id}/settings`);
      revalidatePath(`/projects/${id}`);
      revalidatePath("/projects");
    } catch (error) {
      console.error("Failed to pause project:", error);
      throw error;
    }
  }

  async function handleResume() {
    "use server";
    
    try {
      await resumeProject(id);
      revalidatePath(`/projects/${id}/settings`);
      revalidatePath(`/projects/${id}`);
      revalidatePath("/projects");
    } catch (error) {
      console.error("Failed to resume project:", error);
      throw error;
    }
  }

  return (
    <SettingsClient 
      project={project}
      onSave={handleSave}
      onPause={handlePause}
      onResume={handleResume}
    />
  );
}