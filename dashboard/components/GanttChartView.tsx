'use client';

import { useEffect, useState, useMemo, startTransition } from 'react';
import axios from 'axios';
import { Plus, BarChart3 } from 'lucide-react';
import {
  GanttProvider,
  GanttSidebar,
  GanttSidebarItem,
  GanttTimeline,
  GanttHeader,
  GanttFeatureList,
  GanttFeatureRow,
  GanttToday,
  GanttDependencyLines,
  type GanttFeature,
} from '@/components/ui/gantt';
import { AddTaskModal } from '@/components/AddTaskModal';
import { EditTaskModal } from '@/components/EditTaskModal';

interface TaskData {
  id: number;
  title: string;
  startDate: string | null;
  dueDate: string | null;
  endDate: string | null;
  status: string;
  progress: number;
  dependsOn: string | null;
  projectId: number | null;
  workedHours?: number;
}

interface Project {
  id: number;
  name: string;
  color?: string;
  startDate?: string | null;
  endDate?: string | null;
  status?: string;
}

interface GanttChartViewProps {
  projectId?: number;
  readOnly?: boolean;
}

const statusMap: Record<string, { id: string; name: string; color: string }> = {
  todo: { id: 'todo', name: 'To Do', color: 'hsl(var(--text-tertiary) / 0.5)' },
  in_progress: { id: 'in_progress', name: 'In Progress', color: 'hsl(var(--primary) / 0.6)' },
  done: { id: 'done', name: 'Done', color: 'hsl(var(--success) / 0.6)' },
  test: { id: 'test', name: 'Test', color: 'hsl(var(--secondary) / 0.6)' },
};

type ViewRange = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
type GanttType = 'tasks' | 'projects';

export function GanttChartView({ projectId, readOnly = false }: GanttChartViewProps) {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeChanging, setTypeChanging] = useState(false); // For gantt type change loading
  const [viewChanging, setViewChanging] = useState(false); // For view range change loading
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [parentTaskId, setParentTaskId] = useState<number | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  // View controls
  const [zoom] = useState(100);
  const [viewRange, setViewRange] = useState<ViewRange>('monthly');
  const [ganttType, setGanttType] = useState<GanttType>('tasks');
  const [selectedProjectId, setSelectedProjectId] = useState<number | 'all'>('all');

  useEffect(() => {
    fetchData();
  }, [ganttType]);

  // Function to change view range with loading
  const handleViewRangeChange = (newRange: ViewRange) => {
    if (newRange === viewRange) return; // Skip if same

    // Show loading state and update view range
    setViewChanging(true);
    setViewRange(newRange);

    // Use startTransition for non-urgent state updates
    startTransition(() => {
      setViewChanging(false);
    });
  };

  // Handle gantt type change with loading
  const handleGanttTypeChange = (newType: GanttType) => {
    if (newType === ganttType) return; // Skip if same

    // Show loading state and update gantt type
    setTypeChanging(true);
    setGanttType(newType);

    // Reload data when switching types
    fetchData().finally(() => {
      startTransition(() => {
        setTypeChanging(false);
      });
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // Always fetch all tasks and projects
      const [tasksResponse, projectsResponse] = await Promise.all([
        axios.get('/api/tasks'),
        axios.get('/api/projects')
      ]);

      setTasks(tasksResponse.data.tasks || []);
      setProjects(projectsResponse.data.projects || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Transform tasks to GanttFeature format
  const taskFeatures: GanttFeature[] = useMemo(() => {
    return tasks
      .filter(task => {
        // Filter by selected project if not 'all'
        if (selectedProjectId !== 'all') {
          // Convert both to numbers for comparison
          const taskProjectId = task.projectId ? Number(task.projectId) : null;
          const selectedId = Number(selectedProjectId);
          if (taskProjectId !== selectedId) {
            return false;
          }
        }
        return task.startDate && task.dueDate;
      })
      .map(task => {
        // Check if task title contains "test" (case-insensitive) for purple color
        const isTestTask = task.title?.toLowerCase().includes('test');
        const taskStatus = isTestTask ? 'test' : task.status;

        // Get parent ID from task's parentId field
        const parentId = (task as any).parentId ? (task as any).parentId.toString() : undefined;

        return {
          id: task.id.toString(),
          name: task.title,
          startAt: new Date(task.startDate!),
          endAt: new Date(task.dueDate!),
          status: statusMap[taskStatus] || statusMap.todo,
          lane: task.projectId?.toString() || 'default',
          parentId,
          assignee: (task as any).assignee || undefined,
          workedHours: task.workedHours,
          metadata: {
            task,
            progress: task.progress,
          },
        };
      });
  }, [tasks, selectedProjectId]);

  // Transform projects to GanttFeature format
  const projectFeatures: GanttFeature[] = useMemo(() => {
    return projects
      .filter(project => {
        // Support both camelCase and snake_case field names
        const startDate = (project as any).startDate || (project as any).start_date;
        const endDate = (project as any).endDate || (project as any).end_date;
        return startDate && endDate;
      })
      .map(project => {
        // Support both camelCase and snake_case field names
        const startDate = (project as any).startDate || (project as any).start_date;
        const endDate = (project as any).endDate || (project as any).end_date;
        const status = (project as any).status || 'todo';
        
        return {
          id: `project-${project.id}`,
          name: project.name,
          startAt: new Date(startDate),
          endAt: new Date(endDate),
          status: statusMap[status?.toLowerCase() || 'todo'] || statusMap.todo,
          lane: 'projects',
          metadata: {
            project,
            type: 'project',
          },
        };
      });
  }, [projects]);

  // Select features based on gantt type
  const displayFeatures = useMemo(() => {
    return ganttType === 'projects' ? projectFeatures : taskFeatures;
  }, [ganttType, projectFeatures, taskFeatures]);

  // Use displayFeatures for features variable for compatibility
  const features = displayFeatures;

  // For tasks view: show all tasks without grouping by project
  // For projects view: show all projects
  const displayTasks = useMemo(() => {
    if (ganttType === 'projects') {
      return displayFeatures;
    } else {
      // Just return all filtered tasks without grouping
      return displayFeatures;
    }
  }, [displayFeatures, ganttType]);

  const handleMoveTask = async (id: string, startAt: Date, endAt: Date | null, shiftSubtasks = false) => {
    if (!endAt || readOnly) return;

    // Check if this is a project (starts with "project-")
    if (id.startsWith('project-')) {
      const projectId = parseInt(id.replace('project-', ''));
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      try {
        await axios.put(`/api/projects/${projectId}`, {
          start_date: startAt.toISOString().split('T')[0],
          end_date: endAt.toISOString().split('T')[0],
        });
        await fetchData();
      } catch (error) {
        console.error('Failed to update project:', error);
      }
      return;
    }

    const task = tasks.find(t => t.id.toString() === id);
    if (!task) return;

    console.log('🔄 Moving task:', id, 'from', startAt, 'to', endAt, shiftSubtasks ? '(+ subtasks)' : '');

    try {
      const payload: any = {
        start_date: startAt.toISOString().split('T')[0],
        due_date: endAt.toISOString().split('T')[0],
      };

      // If task has no parentId (is a parent task), shift subtasks
      if (shiftSubtasks) {
        payload.shift_subtasks = true;
      }

      await axios.put(`/api/tasks/${id}`, payload);

      console.log('✅ Task moved successfully');

      // Optimistically update task
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id.toString() === id
            ? {
                ...t,
                startDate: startAt.toISOString().split('T')[0],
                dueDate: endAt.toISOString().split('T')[0],
              }
            : t
        )
      );

      // Refresh data to get updated subtasks and parent
      await fetchData();
    } catch (error) {
      console.error('❌ Failed to update task:', error);
    }
  };

  const handleResizeTask = async (id: string, startAt: Date, endAt: Date) => {
    if (readOnly) return;

    // Check if this is a project (starts with "project-")
    if (id.startsWith('project-')) {
      const projectId = parseInt(id.replace('project-', ''));
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      try {
        await axios.put(`/api/projects/${projectId}`, {
          start_date: startAt.toISOString().split('T')[0],
          end_date: endAt.toISOString().split('T')[0],
        });
        await fetchData();
      } catch (error) {
        console.error('Failed to resize project:', error);
      }
      return;
    }

    console.log('📏 Resizing task:', id, 'from', startAt, 'to', endAt);

    try {
      await axios.put(`/api/tasks/${id}`, {
        start_date: startAt.toISOString().split('T')[0],
        due_date: endAt.toISOString().split('T')[0],
      });

      console.log('✅ Task resized successfully');

      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id.toString() === id
            ? {
                ...task,
                startDate: startAt.toISOString().split('T')[0],
                dueDate: endAt.toISOString().split('T')[0],
              }
            : task
        )
      );

      // Refresh to get updated parent dates if this was a subtask
      await fetchData();
    } catch (error) {
      console.error('Failed to resize task:', error);
    }
  };

  const handleAddTask = (date: Date) => {
    setSelectedDate(date);
    setShowAddTaskModal(true);
  };

  const handleTaskCreated = () => {
    fetchData();
  };

  const handleViewTask = (id: string) => {
    console.log('View task:', id);
  };

  const handleEditTask = (taskId: string) => {
    // Only edit tasks, not projects
    if (taskId.startsWith('project-')) {
      return;
    }
    
    // Find task by ID
    const task = tasks.find(t => t.id.toString() === taskId);
    if (task) {
      // Convert task to EditTaskModal format
      setEditingTask({
        id: task.id,
        title: task.title,
        description: (task as any).description || '',
        project_id: task.projectId,
        assignee: (task as any).assignee || '',
        start_date: task.startDate,
        due_date: task.dueDate,
        end_date: task.endDate,
        priority: (task as any).priority || 'medium',
        status: task.status || 'todo',
      });
    }
  };

  const handleAddSubtask = (parentId: string) => {
    setParentTaskId(parseInt(parentId));
    setShowAddTaskModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl glass-medium border border-white/10 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (displayFeatures.length === 0) {
    return (
      <div className="relative glass-medium rounded-2xl p-16 border border-white/10 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="relative w-20 h-20 mx-auto mb-6 rounded-2xl glass-light flex items-center justify-center border border-white/10">
            <BarChart3 className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-text-primary mb-3">
            {ganttType === 'projects' ? 'No Projects Available' : 'No Tasks Available'}
          </h3>
          <p className="text-text-tertiary text-sm max-w-md mx-auto mb-6">
            {ganttType === 'projects' 
              ? 'Add start and end dates to projects to visualize them on the Gantt chart.'
              : 'Add start and due dates to tasks to visualize them on the Gantt chart. The timeline helps you understand project schedules and track progress.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0 max-h-full min-w-0 max-w-full overflow-hidden">
      {/* View Controls */}
      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 flex-shrink-0">
        {/* Type Selector and Project Filter - Left */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 glass-medium rounded-xl p-1 border border-white/10 overflow-x-auto">
            <button
              onClick={() => handleGanttTypeChange('tasks')}
              aria-label="View tasks only"
              aria-pressed={ganttType === 'tasks'}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                ganttType === 'tasks'
                  ? 'bg-primary/30 text-white border border-primary/50'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => handleGanttTypeChange('projects')}
              aria-label="View projects only"
              aria-pressed={ganttType === 'projects'}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                ganttType === 'projects'
                  ? 'bg-primary/30 text-white border border-primary/50'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              Projects
            </button>
          </div>
          
          {/* Project Filter - only show when viewing tasks */}
          {ganttType === 'tasks' && (
            <select
              value={selectedProjectId}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedProjectId(value === 'all' ? 'all' : Number(value));
              }}
              className="glass-medium rounded-lg px-3 py-2 text-sm font-medium text-white border border-white/10 hover:border-white/20 focus:border-primary/50 focus:outline-none transition-all duration-200 cursor-pointer bg-black/20 backdrop-blur-sm"
              aria-label="Select project"
            >
              <option value="all" className="bg-black/90 text-white">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id} className="bg-black/90 text-white">
                  {project.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* View Range Selector - Right */}
        <div className="flex items-center gap-1 glass-medium rounded-xl p-1 border border-white/10 overflow-x-auto">
          <button
            onClick={() => handleViewRangeChange('daily')}
            aria-label="View daily timeline"
            aria-pressed={viewRange === 'daily'}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              viewRange === 'daily'
                ? 'bg-primary/30 text-white border border-primary/50'
                : 'text-white/60 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => handleViewRangeChange('weekly')}
            aria-label="View weekly timeline"
            aria-pressed={viewRange === 'weekly'}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              viewRange === 'weekly'
                ? 'bg-primary/30 text-white border border-primary/50'
                : 'text-white/60 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => handleViewRangeChange('monthly')}
            aria-label="View monthly timeline"
            aria-pressed={viewRange === 'monthly'}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              viewRange === 'monthly'
                ? 'bg-primary/30 text-white border border-primary/50'
                : 'text-white/60 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => handleViewRangeChange('quarterly')}
            aria-label="View quarterly timeline"
            aria-pressed={viewRange === 'quarterly'}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              viewRange === 'quarterly'
                ? 'bg-primary/30 text-white border border-primary/50'
                : 'text-white/60 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            Quarterly
          </button>
          <button
            onClick={() => handleViewRangeChange('yearly')}
            aria-label="View yearly timeline"
            aria-pressed={viewRange === 'yearly'}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              viewRange === 'yearly'
                ? 'bg-primary/30 text-white border border-primary/50'
                : 'text-white/60 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="glass-medium rounded-2xl border border-white/10 w-full flex-1 flex flex-col min-h-0 max-h-full overflow-hidden min-w-0 max-w-full relative">
        {/* Type/View Change Loading Overlay */}
        {(typeChanging || viewChanging) && (
          <div className="absolute inset-0 z-50 backdrop-blur-xl bg-black/30 flex items-center justify-center rounded-2xl">
            <div className="glass-medium px-8 py-6 rounded-2xl flex items-center gap-4 border border-white/10 shadow-2xl">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
                <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              </div>
              <div>
                <div className="text-base font-semibold text-white">
                  {typeChanging
                    ? (ganttType === 'projects' ? 'Loading Projects View...' : 'Loading Tasks View...')
                    : `Loading ${viewRange.charAt(0).toUpperCase() + viewRange.slice(1)} View...`
                  }
                </div>
                <div className="text-xs text-white/50 mt-1">Reorganizing timeline</div>
              </div>
            </div>
          </div>
        )}
        <div
          className={`h-full min-h-0 min-w-0 max-w-full flex flex-col overflow-hidden transition-opacity duration-300 ${
            (typeChanging || viewChanging) ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <GanttProvider
            features={displayFeatures}
            range={viewRange}
            zoom={zoom}
            onAddItem={handleAddTask}
          >
            <GanttSidebar ganttType={ganttType}>
              {displayTasks.map((feature) => (
                <GanttSidebarItem
                  key={feature.id}
                  feature={feature}
                  onSelectItem={() => handleViewTask(feature.id)}
                  onEditItem={() => handleEditTask(feature.id)}
                  onAddSubtask={handleAddSubtask}
                />
              ))}
            </GanttSidebar>

            <GanttTimeline>
              <GanttHeader />
              <GanttFeatureList>
                {(() => {
                  // Each task gets its own row - no grouping
                  const rows: GanttFeature[][] = displayTasks.map(feature => [feature]);

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {rows.map((rowFeatures, rowIdx) => (
                        <GanttFeatureRow
                          key={`task-row-${rowIdx}`}
                          features={rowFeatures}
                          onMove={handleMoveTask}
                          onResize={handleResizeTask}
                          onEditItem={handleEditTask}
                        >
                          {(taskFeature) => (
                            <div className="flex items-center gap-2 w-full px-3 h-full">
                              <div className="flex-1 min-w-0">
                                <p className="truncate text-xs font-medium text-white/95">{taskFeature.name}</p>
                                {taskFeature.metadata?.progress > 0 && (
                                  <div className="w-full h-1 rounded-full bg-white/10 mt-1 overflow-hidden">
                                    <div
                                      className="h-full bg-white/40 transition-all duration-300"
                                      style={{ width: `${taskFeature.metadata.progress}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                              {taskFeature.metadata?.progress > 0 && (
                                <div className="text-[10px] font-medium text-white/70 px-1.5 py-0.5 rounded bg-white/10">
                                  {taskFeature.metadata.progress}%
                                </div>
                              )}
                            </div>
                          )}
                        </GanttFeatureRow>
                      ))}
                    </div>
                  );
                })()}
                {/* Dependency lines connecting tasks */}
                <GanttDependencyLines features={features} />

                {/* Current date marker */}
                <GanttToday />
              </GanttFeatureList>
            </GanttTimeline>
          </GanttProvider>
        </div>
      </div>

      <style jsx global>{`
        .gantt-scrollbar::-webkit-scrollbar {
          height: 10px;
          width: 10px;
        }
        .gantt-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          backdrop-filter: blur(4px);
        }
        .gantt-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.3));
          border-radius: 8px;
          border: 2px solid rgba(255, 255, 255, 0.05);
          transition: all 0.2s ease;
        }
        .gantt-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--primary) / 0.4));
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => {
          setShowAddTaskModal(false);
          setSelectedDate(undefined);
          setParentTaskId(undefined);
        }}
        onSave={handleTaskCreated}
        initialDate={selectedDate}
        projectId={projectId}
        parentTaskId={parentTaskId}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={() => {
          fetchData();
          setEditingTask(null);
        }}
      />
    </div>
  );
}
