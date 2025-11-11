'use client';

import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Plus, BarChart3 } from 'lucide-react';
import {
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttHeader,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttFeatureRow,
  GanttToday,
  GanttDependencyLines,
  type GanttFeature,
} from '@/components/ui/gantt';
import { AddTaskModal } from '@/components/AddTaskModal';

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
}

interface Project {
  id: number;
  name: string;
  color?: string;
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

export function GanttChartView({ projectId, readOnly = false }: GanttChartViewProps) {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [parentTaskId, setParentTaskId] = useState<number | undefined>(undefined);

  // View controls
  const [zoom] = useState(100);
  const [viewRange, setViewRange] = useState<ViewRange>('monthly');

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const url = projectId ? `/api/tasks?project_id=${projectId}` : '/api/tasks';
      const [tasksResponse, projectsResponse] = await Promise.all([
        axios.get(url),
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
  const features: GanttFeature[] = useMemo(() => {
    return tasks
      .filter(task => task.startDate && task.dueDate)
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
          metadata: {
            task,
            progress: task.progress,
          },
        };
      });
  }, [tasks]);

  // Group features by project (lane)
  const groupedFeatures = useMemo(() => {
    const byProject: Record<string, GanttFeature[]> = {};
    features.forEach(feature => {
      const lane = feature.lane || 'default';
      if (!byProject[lane]) {
        byProject[lane] = [];
      }
      byProject[lane].push(feature);
    });

    return Object.entries(byProject).map(([projectId, projectFeatures]) => {
      const project = projects.find(p => p.id.toString() === projectId);
      return {
        projectId,
        features: projectFeatures,
        groupName: project?.name || (projectId === 'default' ? 'Task' : `Project ${projectId}`),
      };
    });
  }, [features, projects]);

  const handleMoveTask = async (id: string, startAt: Date, endAt: Date | null, shiftSubtasks = false) => {
    if (!endAt || readOnly) return;

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

  if (features.length === 0) {
    return (
      <div className="relative glass-medium rounded-2xl p-16 border border-white/10 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="relative w-20 h-20 mx-auto mb-6 rounded-2xl glass-light flex items-center justify-center border border-white/10">
            <BarChart3 className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-text-primary mb-3">No Tasks Available</h3>
          <p className="text-text-tertiary text-sm max-w-md mx-auto mb-6">
            Add start and due dates to tasks to visualize them on the Gantt chart. The timeline helps you understand project schedules and track progress.
          </p>
          {!readOnly && (
            <button
              onClick={() => setShowAddTaskModal(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 glass-button rounded-xl text-white border border-primary/30 hover: hover:shadow-primary/20 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Task</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0 max-h-full min-w-0 max-w-full overflow-hidden">
      {/* View Controls */}
      <div className="mb-4 flex items-center justify-end gap-2 flex-shrink-0">
        <div className="flex items-center gap-1 glass-medium rounded-xl p-1 border border-white/10">
          <button
            onClick={() => setViewRange('daily')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              viewRange === 'daily'
                ? 'bg-primary/30 text-white border border-primary/50'
                : 'text-white/60 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setViewRange('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              viewRange === 'weekly'
                ? 'bg-primary/30 text-white border border-primary/50'
                : 'text-white/60 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setViewRange('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              viewRange === 'monthly'
                ? 'bg-primary/30 text-white border border-primary/50'
                : 'text-white/60 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setViewRange('quarterly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              viewRange === 'quarterly'
                ? 'bg-primary/30 text-white border border-primary/50'
                : 'text-white/60 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            Quarterly
          </button>
          <button
            onClick={() => setViewRange('yearly')}
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
      <div className="glass-medium rounded-2xl border border-white/10 w-full flex-1 flex flex-col min-h-0 max-h-full overflow-hidden min-w-0 max-w-full">
        <div className="h-full min-h-0 min-w-0 max-w-full flex flex-col overflow-hidden">
          <GanttProvider
            features={features}
            range={viewRange}
            zoom={zoom}
            onAddItem={handleAddTask}
          >
            <GanttSidebar>
              {groupedFeatures.map(({ groupName, features: groupFeatures }) => (
                <GanttSidebarGroup key={groupName} name={groupName}>
                  {groupFeatures.map((feature) => (
                    <GanttSidebarItem
                      key={feature.id}
                      feature={feature}
                      onSelectItem={() => handleViewTask(feature.id)}
                      onAddSubtask={handleAddSubtask}
                    />
                  ))}
                </GanttSidebarGroup>
              ))}
            </GanttSidebar>

            <GanttTimeline>
              <GanttHeader />
              <GanttFeatureList>
                {groupedFeatures.map(({ groupName, features: groupFeatures }) => {
                  // Group features by row (non-overlapping)
                  const rows: GanttFeature[][] = [];
                  groupFeatures.forEach(feature => {
                    let placed = false;
                    for (let i = 0; i < rows.length; i++) {
                      const canPlace = rows[i].every(existing => {
                        return (
                          feature.endAt < existing.startAt ||
                          feature.startAt > existing.endAt
                        );
                      });
                      if (canPlace) {
                        rows[i].push(feature);
                        placed = true;
                        break;
                      }
                    }
                    if (!placed) {
                      rows.push([feature]);
                    }
                  });

                  return (
                    <GanttFeatureListGroup key={groupName}>
                      {rows.map((rowFeatures, rowIdx) => (
                        <GanttFeatureRow
                          key={`${groupName}-row-${rowIdx}`}
                          features={rowFeatures}
                          onMove={handleMoveTask}
                          onResize={handleResizeTask}
                        >
                          {(taskFeature) => (
                            <div className="flex items-center gap-2 w-full px-3 py-1">
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
                    </GanttFeatureListGroup>
                  );
                })}
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
    </div>
  );
}
