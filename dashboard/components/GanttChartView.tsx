'use client';

import { useEffect, useState, useRef } from 'react';
import Gantt from 'frappe-gantt';
import axios from 'axios';
import { Calendar } from 'lucide-react';

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

interface GanttChartViewProps {
  projectId?: number;
}

type ViewMode = 'Day' | 'Week' | 'Month' | 'Year';

export function GanttChartView({ projectId }: GanttChartViewProps) {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('Month');
  const ganttContainerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<Gantt | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const url = projectId ? `/api/tasks?project_id=${projectId}` : '/api/tasks';
        const response = await axios.get(url);
        setTasks(response.data.tasks || []);
      } catch (error) {
        console.error('Failed to load tasks:', error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [projectId]);

  useEffect(() => {
    if (loading || !ganttContainerRef.current) {
      return;
    }

    const ganttTasks = tasks
      .filter(task => task.startDate && task.dueDate)
      .map(task => ({
        id: `task-${task.id}`,
        name: task.title,
        start: task.startDate!.split('T')[0],
        end: task.dueDate!.split('T')[0],
        progress: task.progress || 0,
        dependencies: task.dependsOn ? JSON.parse(task.dependsOn).map((depId: number) => `task-${depId}`) : [],
        custom_class: task.status === 'done' ? 'done' : task.status === 'in_progress' ? 'in-progress' : 'todo',
      }));

    if (ganttTasks.length === 0) {
        ganttContainerRef.current.innerHTML = '';
        ganttRef.current = null;
        return;
    }
    
    ganttContainerRef.current.innerHTML = '';
    ganttRef.current = new Gantt(ganttContainerRef.current, ganttTasks, {
        header_height: 65,
        column_width: 30,
        step: 24,
        view_modes: ['Quarter Day', 'Half Day', 'Day', 'Week', 'Month'],
        bar_height: 20,
        bar_corner_radius: 3,
        arrow_curve: 5,
        padding: 18,
        view_mode: viewMode,
        date_format: 'YYYY-MM-DD',
        custom_popup_html: null,
        language: 'en',
        on_click: (task) => {
            console.log(task);
        },
        on_date_change: (task, start, end) => {
            console.log(task, start, end);
        },
        on_progress_change: (task, progress) => {
            console.log(task, progress);
        },
        on_view_change: (mode) => {
            setViewMode(mode as ViewMode);
        }
    });

  }, [tasks, loading, projectId]);

  useEffect(() => {
    if (ganttRef.current) {
      ganttRef.current.change_view_mode(viewMode);
    }
  }, [viewMode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const ganttTasks = tasks.filter(task => task.startDate && task.dueDate);

  if (ganttTasks.length === 0) {
    return (
      <div className="glass-medium rounded-2xl p-12 border border-white/10 text-center">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-text-tertiary opacity-50" />
        <p className="text-text-tertiary text-lg font-medium mb-2">No tasks with dates available</p>
        <p className="text-text-tertiary text-sm">Add start and due dates to tasks to view them in the Gantt chart</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Controls */}
      <div className="glass-medium rounded-2xl p-4 border border-white/10 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-text-secondary" />
            <span className="text-sm font-medium text-text-primary">View Mode</span>
          </div>
          <div className="flex items-center space-x-2">
            {(['Day', 'Week', 'Month', 'Year'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === mode
                    ? 'bg-primary text-white shadow-[0_0_15px_rgba(128,152,249,0.5)]'
                    : 'glass-light text-text-secondary hover:glass-medium hover:text-text-primary'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Gantt Chart Container */}
      <div className="glass-medium rounded-2xl p-6 border border-white/10 w-full overflow-x-auto custom-scrollbar">
        <div ref={ganttContainerRef} className="gantt-container" style={{ minHeight: '400px', width: '100%' }}></div>
      </div>

      {/* Legend */}
      <div className="glass-medium rounded-2xl p-4 border border-white/10">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(107, 114, 128, 0.8)' }}></div>
            <span className="text-text-secondary">To Do</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(128, 152, 249, 0.85)' }}></div>
            <span className="text-text-secondary">In Progress</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.85)' }}></div>
            <span className="text-text-secondary">Done</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .gantt-container {
          --background-color: transparent;
          --border-color: rgba(255, 255, 255, 0.1);
          --text-color: rgba(255, 255, 255, 0.8);
          --primary-color: #8098f9;
          --header-background: rgba(255, 255, 255, 0.05);
        }

        .gantt .grid-header {
          background-color: var(--header-background);
          backdrop-filter: blur(4px);
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .gantt .grid-header .upper-text,
        .gantt .grid-header .lower-text {
          fill: var(--text-color);
        }
        
        .gantt .grid-background {
          fill: var(--background-color);
        }

        .gantt .grid-row:nth-child(even) {
            fill: rgba(255, 255, 255, 0.02);
        }

        .gantt .row-line,
        .gantt .tick {
          stroke: var(--border-color);
        }

        .gantt .today-highlight {
          fill: rgba(128, 152, 249, 0.1);
        }

        .gantt .bar-wrapper .bar {
          stroke-width: 0;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }
        
        .gantt .bar-wrapper.todo .bar { fill: #6b7280; }
        .gantt .bar-wrapper.in-progress .bar { fill: #8098f9; }
        .gantt .bar-wrapper.done .bar { fill: #10b981; }

        .gantt .bar-progress {
          fill: rgba(255, 255, 255, 0.3);
        }

        .gantt .bar-label {
          fill: #fff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .gantt .arrow {
          fill: var(--primary-color);
        }
        
        .gantt-popup .pointer {
            border-top-color: #2d3748;
        }
        
        .gantt-popup .title {
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        
        .gantt-popup .subtitle {
            color: #a0aec0;
            font-size: 0.875rem;
        }

        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(128, 152, 249, 0.5);
        }
      `}</style>
    </div>
  );
}
