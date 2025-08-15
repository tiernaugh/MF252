"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { 
  ChevronLeft,
  Clock,
  Lock,
  PauseCircle,
  Trash2,
  AlertTriangle,
  Check
} from "lucide-react";
import type { Project, CadenceMode } from "~/lib/mock-data";

interface SettingsClientProps {
  project: Project;
  onSave: (settings: {
    title?: string;
    cadenceConfig?: {
      mode: CadenceMode;
      days: number[];
    };
    status?: "ACTIVE" | "PAUSED";
  }) => Promise<void>;
  onPause: () => Promise<void>;
  onResume: () => Promise<void>;
}

// Days of the week
const daysOfWeek = [
  { value: 0, label: 'S', fullName: 'Sunday' },
  { value: 1, label: 'M', fullName: 'Monday' },
  { value: 2, label: 'T', fullName: 'Tuesday' },
  { value: 3, label: 'W', fullName: 'Wednesday' },
  { value: 4, label: 'T', fullName: 'Thursday' },
  { value: 5, label: 'F', fullName: 'Friday' },
  { value: 6, label: 'S', fullName: 'Saturday' },
];

// Helper function to calculate next occurrence from selected days
function getNextOccurrence(selectedDays: number[], lastPublished: Date | null): Date | null {
  if (selectedDays.length === 0) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day
  
  // Check next 7 days to find the next matching day
  for (let i = 1; i <= 7; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + i);
    const dayOfWeek = checkDate.getDay();
    
    if (selectedDays.includes(dayOfWeek)) {
      return checkDate;
    }
  }
  
  // Shouldn't reach here if days are selected
  return null;
}

// Helper to calculate episodes per month
function getEpisodesPerMonth(selectedDays: number[]): number {
  // Rough calculation: 4.33 weeks per month
  return Math.round(selectedDays.length * 4.33);
}

// Helper to calculate days until date
function getDaysUntil(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function SettingsClient({ project, onSave, onPause, onResume }: SettingsClientProps) {
  const router = useRouter();
  
  // Track original and current schedule
  const originalDays = project?.cadenceConfig?.days ?? [2]; // Default to Tuesday
  const [selectedDays, setSelectedDays] = useState<number[]>(originalDays);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Calculate preview date whenever selectedDays change
  const [previewDate, setPreviewDate] = useState<Date | null>(null);
  
  useEffect(() => {
    if (project && !project.isPaused) {
      const nextDate = getNextOccurrence(selectedDays, project.lastPublishedAt);
      setPreviewDate(nextDate);
    }
  }, [selectedDays, project]);
  
  // Check if arrays are equal for change detection
  const arraysEqual = (a: number[], b: number[]) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, index) => val === sortedB[index]);
  };

  // Toggle day selection
  const handleDayToggle = (day: number) => {
    if (selectedDays.includes(day)) {
      // Don't allow deselecting last day
      if (selectedDays.length > 1) {
        const newDays = selectedDays.filter(d => d !== day);
        setSelectedDays(newDays);
        setHasChanges(!arraysEqual(newDays, originalDays));
      }
    } else {
      const newDays = [...selectedDays, day].sort();
      setSelectedDays(newDays);
      setHasChanges(!arraysEqual(newDays, originalDays));
    }
  };

  // Reset to original schedule
  const handleReset = () => {
    setSelectedDays(originalDays);
    setHasChanges(false);
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      await onSave({
        cadenceConfig: {
          mode: selectedDays.length === 7 ? 'daily' : 
                selectedDays.length === 5 && !selectedDays.includes(0) && !selectedDays.includes(6) ? 'weekdays' : 
                'custom',
          days: selectedDays
        }
      });
      
      setHasChanges(false);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle pause/resume
  const handlePauseToggle = async () => {
    if (project.isPaused) {
      await onResume();
    } else {
      await onPause();
    }
    router.refresh();
  };

  // Delete project (placeholder)
  const handleDelete = () => {
    if (showDeleteConfirm) {
      console.log("Deleting project", project.id);
      // In production, would delete and redirect
      router.push('/projects');
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header with back button */}
      <div className="border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link 
            href={`/projects/${project.id}`}
            className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Project
          </Link>
          <h1 className="font-serif text-3xl font-bold text-stone-900 mt-4">
            Project Settings
          </h1>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        
        {/* Project Overview Section */}
        <Card className="bg-white border border-stone-200">
          <CardContent className="p-8">
            <h2 className="font-serif text-2xl font-semibold text-stone-900 mb-2">
              Project Overview
            </h2>
            <p className="text-sm text-stone-600 mb-6">
              Title and core brief that guide episode generation and research focus for this project.
            </p>

            {/* Project Title */}
            <h3 className="font-serif text-xl font-bold text-stone-900 mb-4">
              {project.title}
            </h3>

            {/* Project Brief */}
            <div className="max-h-64 overflow-y-auto border border-stone-200 rounded-lg p-4 bg-stone-50">
              <div className="prose prose-sm text-stone-800 max-w-none">
                <p>{project.description}</p>
                {project.onboardingBrief && (
                  <>
                    <p className="mt-4">
                      <strong>Context:</strong> {project.onboardingBrief.context || "Strategic foresight and trend analysis"}
                    </p>
                    {project.onboardingBrief.focusAreas && (
                      <>
                        <p className="mt-2">
                          <strong>Focus Areas:</strong>
                        </p>
                        <ul>
                          {project.onboardingBrief.focusAreas.map((area, i) => (
                            <li key={i}>{area}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            <p className="text-xs text-stone-500 mt-4">
              Project descriptions cannot be changed while a project is live. Create a new project to explore a different brief.
            </p>
          </CardContent>
        </Card>

        {/* Episode Schedule Section */}
        <Card className="bg-white border border-stone-200">
          <CardContent className="p-8">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-stone-500" />
              <h2 className="font-serif text-2xl font-semibold text-stone-900">
                Episode Schedule
              </h2>
            </div>

            {/* Schedule configuration */}
            <div className="space-y-4">
              {/* Day selector */}
              <div>
                <p className="text-sm text-stone-600 mb-3">Select days for episode delivery</p>
                <div className="flex gap-2 mb-3">
                  {daysOfWeek.map(day => (
                    <button
                      key={day.value}
                      onClick={() => handleDayToggle(day.value)}
                      disabled={selectedDays.length === 1 && selectedDays.includes(day.value)}
                      className={`
                        w-12 h-12 rounded-lg border-2 font-medium transition-all
                        ${selectedDays.includes(day.value)
                          ? 'border-stone-900 bg-stone-900 text-white' 
                          : 'border-stone-200 hover:border-stone-400 text-stone-700'}
                        ${selectedDays.length === 1 && selectedDays.includes(day.value) 
                          ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                      title={selectedDays.length === 1 && selectedDays.includes(day.value) 
                        ? "At least one day must be selected" 
                        : day.fullName}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-stone-500">
                  Episodes deliver at 9am in your timezone
                </p>
              </div>

              {/* Preview & Summary */}
              <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-stone-700">Episodes per month:</span>
                  <span className="text-sm font-semibold text-stone-900">
                    ~{getEpisodesPerMonth(selectedDays)}
                  </span>
                </div>
                
                {!project.isPaused && previewDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-stone-700">Next episode:</span>
                    <span className="text-sm font-semibold text-stone-900">
                      {previewDate.toLocaleDateString('en-GB', { 
                        weekday: 'long',
                        day: 'numeric', 
                        month: 'short' 
                      })}
                      <span className="text-xs text-stone-500 ml-1">
                        ({getDaysUntil(previewDate)} days)
                      </span>
                    </span>
                  </div>
                )}
                
                {project.isPaused && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Project is paused - no episodes will be generated
                    </span>
                  </div>
                )}
              </div>

              {/* Save/Reset buttons */}
              {hasChanges && (
                <div className="flex gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-stone-900 hover:bg-stone-800 text-white"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="border-stone-300"
                  >
                    Reset
                  </Button>
                </div>
              )}

              {/* Success message */}
              {showSaveSuccess && (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Schedule updated successfully!</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Status Section */}
        <Card className="bg-white border border-stone-200">
          <CardContent className="p-8">
            <div className="flex items-center gap-2 mb-6">
              <PauseCircle className="w-5 h-5 text-stone-500" />
              <h2 className="font-serif text-2xl font-semibold text-stone-900">
                Project Status
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    {project.isPaused ? "Project is paused" : "Project is active"}
                  </p>
                  <p className="text-xs text-stone-600 mt-1">
                    {project.isPaused 
                      ? "Resume to continue receiving episodes" 
                      : "Pause to temporarily stop episode generation"}
                  </p>
                </div>
                <Button
                  onClick={handlePauseToggle}
                  variant={project.isPaused ? "default" : "outline"}
                  className={project.isPaused 
                    ? "bg-stone-900 hover:bg-stone-800 text-white" 
                    : "border-stone-300"}
                >
                  {project.isPaused ? "Resume Project" : "Pause Project"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-white border border-red-200">
          <CardContent className="p-8">
            <div className="flex items-center gap-2 mb-6">
              <Trash2 className="w-5 h-5 text-red-500" />
              <h2 className="font-serif text-2xl font-semibold text-stone-900">
                Danger Zone
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-900">Delete this project</p>
                  <p className="text-xs text-stone-600 mt-1">
                    Once deleted, all episodes and data will be permanently removed.
                  </p>
                </div>
                <Button
                  onClick={handleDelete}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  {showDeleteConfirm ? "Click again to confirm" : "Delete Project"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}