"use client";

import { useState, use, useEffect } from "react";
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
import { 
  mockProjects,
  mockUser,
  type Project,
  type CadenceMode
} from "~/lib/mock-data";

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

export default function ProjectSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  // Find project from mock data
  const [project, setProject] = useState<Project | undefined>(
    mockProjects.find(p => p.id === id)
  );
  
  // Track original and current schedule
  const originalDays = project?.cadenceConfig?.days ?? [2]; // Default to Tuesday
  const [selectedDays, setSelectedDays] = useState<number[]>(originalDays);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
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

  if (!project) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-serif font-bold text-stone-900 mb-4">
            Project not found
          </h1>
          <Link href="/projects" className="text-blue-600 hover:text-blue-700">
            ← Back to projects
          </Link>
        </div>
      </div>
    );
  }

  // Day of week helpers
  const daysOfWeek = [
    { value: 0, label: 'Sun', full: 'Sunday' },
    { value: 1, label: 'Mon', full: 'Monday' },
    { value: 2, label: 'Tue', full: 'Tuesday' },
    { value: 3, label: 'Wed', full: 'Wednesday' },
    { value: 4, label: 'Thu', full: 'Thursday' },
    { value: 5, label: 'Fri', full: 'Friday' },
    { value: 6, label: 'Sat', full: 'Saturday' },
  ];

  // Format next episode date with days until
  const formatNextEpisode = (date: Date | null, showDaysUntil: boolean = false) => {
    if (project.isPaused) return "Episode generation paused";
    if (!date) return "Not scheduled";
    
    const dayName = daysOfWeek.find(d => d.value === date.getDay())?.full ?? '';
    const formatted = `${dayName} ${date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short' 
    })}`;
    
    if (showDaysUntil) {
      const days = getDaysUntil(date);
      if (days === 0) return `${formatted} (today)`;
      if (days === 1) return `${formatted} (tomorrow)`;
      return `${formatted} (in ${days} days)`;
    }
    
    return formatted;
  };

  // Handlers
  const handleDayToggle = (day: number) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day].sort();
    
    setSelectedDays(newDays);
    setHasChanges(!arraysEqual(newDays, originalDays));
  };

  const handlePresetSelect = (preset: 'weekdays' | 'everyday') => {
    let newDays: number[];
    if (preset === 'weekdays') {
      newDays = [1, 2, 3, 4, 5]; // Mon-Fri
    } else {
      newDays = [0, 1, 2, 3, 4, 5, 6]; // All days
    }
    setSelectedDays(newDays);
    setHasChanges(!arraysEqual(newDays, originalDays));
  };

  const handleSaveSchedule = () => {
    // Update the project with new schedule
    setProject(prev => {
      if (!prev) return undefined;
      return {
        ...prev,
        cadenceConfig: {
          ...prev.cadenceConfig,
          days: selectedDays
        },
        nextScheduledAt: previewDate
      };
    });
    
    // Show success feedback
    setShowSaveSuccess(true);
    setHasChanges(false);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const handleCancelChanges = () => {
    setSelectedDays(originalDays);
    setHasChanges(false);
  };

  const handlePauseProject = () => {
    setProject(prev => prev ? {
      ...prev,
      isPaused: !prev.isPaused
    } : undefined);
  };

  const handleDeleteProject = () => {
    if (showDeleteConfirm) {
      // In production, would delete from database
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
            href={`/projects/${id}`}
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
                      <strong>Context:</strong> {project.onboardingBrief.context}
                    </p>
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
                        ? 'At least one day must be selected' : ''}
                    >
                      {day.label[0]}
                    </button>
                  ))}
                </div>
                
                {/* Quick presets */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePresetSelect('weekdays')}
                    className="text-sm px-3 py-1 rounded-full border border-stone-300 hover:bg-stone-50 transition-colors"
                  >
                    Weekdays
                  </button>
                  <button
                    onClick={() => handlePresetSelect('everyday')}
                    className="text-sm px-3 py-1 rounded-full border border-stone-300 hover:bg-stone-50 transition-colors"
                  >
                    Every day
                  </button>
                </div>
              </div>

              {/* Next episode display with save controls */}
              <div className="pt-4 border-t border-stone-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-stone-600 mb-1">
                      {hasChanges ? 'New schedule' : 'Current schedule'}
                    </p>
                    <p className="text-base text-stone-700 font-medium">
                      Next episode: {formatNextEpisode(
                        hasChanges ? previewDate : project.nextScheduledAt,
                        hasChanges
                      )}
                    </p>
                    {selectedDays.length > 0 && (
                      <p className="text-sm text-stone-500 mt-1">
                        ~{getEpisodesPerMonth(selectedDays)} episodes per month
                      </p>
                    )}
                  </div>
                  
                  {hasChanges && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelChanges}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveSchedule}
                        className="bg-stone-900 hover:bg-stone-800 text-white"
                      >
                        Save Changes
                      </Button>
                    </div>
                  )}
                  
                  {showSaveSuccess && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">Schedule updated</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Actions Section */}
        <Card className="bg-white border border-stone-200">
          <CardContent className="p-8">
            <h2 className="font-serif text-2xl font-semibold text-stone-900 mb-6">
              Project Actions
            </h2>
            
            <div className="space-y-3">
              {/* Pause Project */}
              <div className="flex items-center justify-between p-4 border border-stone-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <PauseCircle className="w-5 h-5 text-orange-500" />
                  <div>
                    <div className="font-medium text-stone-900">
                      {project.isPaused ? 'Resume Project' : 'Pause Project'}
                    </div>
                    <div className="text-sm text-stone-600">
                      {project.isPaused 
                        ? 'Resume episode generation' 
                        : 'Stop episode generation temporarily'}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handlePauseProject}
                  variant="outline"
                  className={`
                    ${project.isPaused 
                      ? 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100' 
                      : 'border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100'}
                  `}
                >
                  {project.isPaused ? 'Resume' : 'Pause'}
                </Button>
              </div>

              {/* Delete Project */}
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <div>
                    <div className="font-medium text-stone-900">Delete Project</div>
                    <div className="text-sm text-stone-600">
                      Permanently delete project and all episodes
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleDeleteProject}
                  variant="outline"
                  className={`
                    border-red-300 bg-red-100 hover:bg-red-200
                    ${showDeleteConfirm 
                      ? 'text-red-800 font-medium' 
                      : 'text-red-700'}
                  `}
                >
                  {showDeleteConfirm ? (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Confirm Delete
                    </>
                  ) : (
                    'Delete'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}