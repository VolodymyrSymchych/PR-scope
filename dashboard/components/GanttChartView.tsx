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
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<Gantt | null>(null);

  // Load tasks
  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const url = projectId ? `/api/tasks?project_id=${projectId}` : '/api/tasks';
      const response = await axios.get(url);
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Convert tasks to Frappe Gantt format
  const convertToGanttTasks = (tasks: TaskData[]) => {
    return tasks
      .filter(task => task.startDate && task.dueDate)
      .map(task => {
        const start = new Date(task.startDate!);
        const end = new Date(task.dueDate!);
        const dependsOn = task.dependsOn ? JSON.parse(task.dependsOn) : [];
        
        let custom_class = 'todo';
        if (task.status === 'done') {
          custom_class = 'done';
        } else if (task.status === 'in_progress') {
          custom_class = 'in-progress';
        }
        
        return {
          id: `task-${task.id}`,
          name: task.title,
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
          progress: task.progress || 0,
          custom_class: custom_class,
          dependencies: dependsOn.map((depId: number) => `task-${depId}`),
        };
      });
  };

  // Initialize Gantt chart
  useEffect(() => {
    if (loading || !containerRef.current) return;

    const ganttTasks = convertToGanttTasks(tasks);
    if (ganttTasks.length === 0) return;

    // Clear container
    containerRef.current.innerHTML = '';
    ganttRef.current = null;

    // Initialize Gantt
    try {
      const gantt = new Gantt(containerRef.current, ganttTasks, {
        view_mode: viewMode,
        header_height: 50,
        column_width: viewMode === 'Day' ? 50 : viewMode === 'Week' ? 80 : viewMode === 'Month' ? 120 : 200,
        bar_height: 36,
        bar_corner_radius: 4,
        arrow_curve: 5,
        padding: 18,
        date_format: 'YYYY-MM-DD',
        language: 'en',
        scroll_to: 'today',
        today_button: true,
        popup_on: 'click',
      });

      ganttRef.current = gantt;
    } catch (error) {
      console.error('Failed to initialize Gantt:', error);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      ganttRef.current = null;
    };
  }, [tasks, viewMode, loading]);

  // Update view mode
  useEffect(() => {
    if (ganttRef.current && !loading) {
      ganttRef.current.change_view_mode(viewMode, false);
    }
  }, [viewMode, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const ganttTasks = convertToGanttTasks(tasks);

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
      {/* Controls - First */}
      <div className="glass-medium rounded-2xl p-4 border border-white/10 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-text-secondary" />
            <span className="text-sm font-medium text-text-primary">View Mode</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('Day')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === 'Day'
                  ? 'bg-primary text-white shadow-[0_0_15px_rgba(128,152,249,0.5)]'
                  : 'glass-light text-text-secondary hover:glass-medium hover:text-text-primary'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('Week')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === 'Week'
                  ? 'bg-primary text-white shadow-[0_0_15px_rgba(128,152,249,0.5)]'
                  : 'glass-light text-text-secondary hover:glass-medium hover:text-text-primary'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('Month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === 'Month'
                  ? 'bg-primary text-white shadow-[0_0_15px_rgba(128,152,249,0.5)]'
                  : 'glass-light text-text-secondary hover:glass-medium hover:text-text-primary'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('Year')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === 'Year'
                  ? 'bg-primary text-white shadow-[0_0_15px_rgba(128,152,249,0.5)]'
                  : 'glass-light text-text-secondary hover:glass-medium hover:text-text-primary'
              }`}
            >
              Year
            </button>
          </div>
        </div>
      </div>
      
      {/* Gantt Chart Container - After Controls */}
      <div className="glass-medium rounded-2xl p-6 border border-white/10 w-full overflow-hidden">
        <div ref={containerRef} className="gantt-container w-full custom-scrollbar" style={{ minHeight: '400px' }}></div>
      </div>

      {/* Legend */}
      <div className="glass-medium rounded-2xl p-4 border border-white/10">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(107, 114, 128, 0.8)', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}></div>
            <span className="text-text-secondary">To Do</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(128, 152, 249, 0.85)', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}></div>
            <span className="text-text-secondary">In Progress</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.85)', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}></div>
            <span className="text-text-secondary">Done</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        body {
          overflow-x: hidden !important;
        }

        .gantt-container {
          background: transparent !important;
          width: 100% !important;
          min-height: 400px !important;
          display: block !important;
          position: relative !important;
          overflow-x: auto !important;
          overflow-y: visible !important;
          font-size: 12px !important;
        }
        
        .gantt-container svg.gantt {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          width: 100% !important;
          height: auto !important;
          min-height: 400px !important;
        }

        .gantt-container svg {
          display: block !important;
          background: transparent !important;
          font-family: inherit !important;
          overflow: visible !important;
        }
        
        .gantt-container .grid-header {
          position: sticky !important;
          top: 0 !important;
          z-index: 10 !important;
          background-color: rgba(255, 255, 255, 0.05) !important;
          backdrop-filter: blur(4px) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        }

        .gantt-container svg .grid-background {
          fill: rgba(255, 255, 255, 0.02) !important;
        }

        .gantt-container svg .grid-row {
          fill: rgba(255, 255, 255, 0.02) !important;
        }

        .gantt-container svg .row-line {
          stroke: rgba(255, 255, 255, 0.08) !important;
          stroke-width: 1px !important;
        }

        .gantt-container svg .tick {
          stroke: rgba(255, 255, 255, 0.08) !important;
          stroke-width: 1px !important;
        }

        .gantt-container svg .tick.thick {
          stroke: rgba(255, 255, 255, 0.12) !important;
          stroke-width: 1px !important;
        }

        .gantt-container svg .today-highlight,
        .gantt-container .current-highlight {
          background: rgba(128, 152, 249, 0.15) !important;
          stroke: rgba(128, 152, 249, 0.3) !important;
        }

        .gantt-container .upper-text,
        .gantt-container .lower-text {
          fill: rgba(255, 255, 255, 0.8) !important;
          font-size: 10px !important;
          font-weight: 500 !important;
          font-family: inherit !important;
        }

        .gantt-container .upper-text {
          font-weight: 600 !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          color: rgba(255, 255, 255, 0.9) !important;
        }

        .gantt-container svg .bar-wrapper {
          cursor: pointer !important;
        }

        .gantt-container svg .bar {
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3)) !important;
          transition: all 0.2s ease !important;
          rx: 4px !important;
          ry: 4px !important;
          stroke-width: 0 !important;
        }

        .gantt-container svg .bar-wrapper:hover .bar {
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4)) !important;
          opacity: 0.9 !important;
        }

        .gantt-container svg .bar.todo {
          fill: rgba(107, 114, 128, 0.8) !important;
        }

        .gantt-container svg .bar.in-progress {
          fill: rgba(128, 152, 249, 0.85) !important;
        }

        .gantt-container svg .bar.done {
          fill: rgba(16, 185, 129, 0.85) !important;
        }

        .gantt-container svg .bar-progress {
          fill: rgba(255, 255, 255, 0.3) !important;
          rx: 4px !important;
          ry: 4px !important;
        }

        .gantt-container svg .bar-label {
          fill: rgba(255, 255, 255, 0.95) !important;
          font-weight: 500 !important;
          font-size: 12px !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
        }

        .gantt-container svg .arrow {
          stroke: rgba(128, 152, 249, 0.6) !important;
          fill: rgba(128, 152, 249, 0.6) !important;
          stroke-width: 2px !important;
        }

        .gantt-container svg .handle {
          fill: rgba(255, 255, 255, 0.3) !important;
          stroke: rgba(255, 255, 255, 0.5) !important;
          stroke-width: 1px !important;
        }

        .gantt-container svg .handle.active,
        .gantt-container svg .handle.visible {
          opacity: 1 !important;
          cursor: ew-resize !important;
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
