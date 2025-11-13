'use client';

import { useEffect, useState } from 'react';
import { FolderKanban, CheckCircle, TrendingUp, AlertCircle, MessageSquare } from 'lucide-react';
import { StatsCard } from '@/components/StatsCard';
import { ProjectCard } from '@/components/ProjectCard';
import { CalendarView } from '@/components/CalendarView';
import { BudgetTracking } from '@/components/BudgetTracking';
import { ProgressSection } from '@/components/ProgressSection';
import { UpcomingTasks } from '@/components/UpcomingTasks';
import { api, Project, Stats } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import axios from 'axios';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    projects_in_progress: 0,
    total_projects: 0,
    completion_rate: 0,
    projects_completed: 0
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTask, setActiveTask] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, projectsData] = await Promise.all([
        api.getStats(),
        api.getProjects()
      ]);
      setStats(statsData);
      setProjects(projectsData.projects.slice(0, 4)); // Show only first 4 projects
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    // Fetch task data from active data
    if (active.data.current?.task) {
      setActiveTask(active.data.current.task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    
    if (!over) return;

    // Check if task was dropped on a calendar date
    const taskId = typeof active.id === 'number' ? active.id : parseInt(active.id as string);
    const dateId = over.id;

    // If dropped on a calendar date (format: "date-YYYY-MM-DD")
    if (typeof dateId === 'string' && dateId.startsWith('date-')) {
      const dateStr = dateId.replace('date-', '');
      const originalTask = active.data.current?.task;
      
      try {
        // If task has start_date and end_date, update them to span multiple days
        // Otherwise, just update due_date
        if (originalTask?.start_date && originalTask?.end_date) {
          // Calculate duration
          const startDate = new Date(originalTask.start_date);
          const endDate = new Date(originalTask.end_date);
          const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Set new start_date to dropped date
          const newStartDate = new Date(dateStr);
          const newEndDate = new Date(newStartDate);
          newEndDate.setDate(newStartDate.getDate() + duration);
          
          await axios.put(`/api/tasks/${taskId}`, {
            start_date: newStartDate.toISOString().split('T')[0],
            due_date: dateStr,
            end_date: newEndDate.toISOString().split('T')[0],
          });
        } else {
          // Simple task - just update due_date
          await axios.put(`/api/tasks/${taskId}`, {
            due_date: dateStr,
          });
        }
        
        // Trigger refresh of calendar and tasks
        setRefreshKey(prev => prev + 1);
        toast.success('Task date updated successfully');
      } catch (error: any) {
        console.error('Failed to update task due date:', error);
        toast.error(`Failed to update task: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Projects In Progress"
            value={stats.projects_in_progress}
            icon={FolderKanban}
            iconBgColor="bg-red-500"
            trend={stats.trends?.projects_in_progress}
          />
          <StatsCard
            title="Completion Rate"
            value={`${stats.completion_rate}%`}
            icon={TrendingUp}
            iconBgColor="bg-orange-500"
          />
          <StatsCard
            title="Total Projects"
            value={stats.total_projects}
            icon={CheckCircle}
            iconBgColor="bg-blue-500"
            trend={stats.trends?.total_projects}
          />
          <StatsCard
            title="High Risk Projects"
            value={projects.filter(p => p.risk_level === 'HIGH' || p.risk_level === 'CRITICAL').length}
            icon={AlertCircle}
            iconBgColor="bg-yellow-500"
          />
          <BudgetTracking />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Projects and Calendar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Projects */}
            <div className="glass-medium rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-text-primary">
                  Recent Projects
                </h3>
                <button
                  onClick={() => router.push('/projects')}
                  className="text-sm text-[#8098F9] hover:text-[#a0b0fc] transition-colors"
                >
                  View All
                </button>
              </div>
              {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      {...project}
                      team={['JD', 'SK', 'MR', 'AR', 'TC', 'LM']}
                      onClick={() => router.push(`/projects/${project.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FolderKanban className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                  <p className="text-text-secondary">
                    No projects yet. Start by analyzing your first project!
                  </p>
                  <button
                    onClick={() => router.push('/projects/new')}
                    className="mt-4 px-4 py-2 glass-button text-white rounded-lg"
                  >
                    New Analysis
                  </button>
                </div>
              )}
            </div>

            {/* Calendar */}
            <CalendarView key={refreshKey} />
          </div>

          {/* Right Column - Progress and Tasks */}
          <div className="space-y-6">
            <ProgressSection />
            <UpcomingTasks key={refreshKey} />
          </div>
        </div>
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="glass-medium rounded-xl p-3 border border-white/20  rotate-2 bg-[#8098F9]/10 backdrop-blur-xl">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg glass-light flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-[#8098F9]" />
              </div>
              <div>
                <div className="font-semibold text-text-primary text-sm">
                  {activeTask.title}
                </div>
                {activeTask.due_date && (
                  <div className="text-xs text-text-tertiary">
                    {new Date(activeTask.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
