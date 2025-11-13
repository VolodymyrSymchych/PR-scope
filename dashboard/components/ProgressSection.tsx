'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Clock, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { Loader } from '@/components/Loader';

interface Task {
  id: number;
  status: string;
}

interface TimeEntry {
  clockIn: string;
  clockOut: string | null;
  duration: number | null;
}

interface ProgressItem {
  icon: React.ElementType;
  name: string;
  value: string;
  progress: number;
  color: string;
}

export function ProgressSection() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksResponse, attendanceResponse] = await Promise.all([
        axios.get('/api/tasks'),
        axios.get('/api/attendance')
      ]);
      
      setTasks(tasksResponse.data.tasks || []);
      setTimeEntries(attendanceResponse.data.entries || []);
    } catch (error) {
      console.error('Failed to load progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate task statistics
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done' || t.status === 'Done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'In Progress').length;
  const todoTasks = tasks.filter(t => t.status === 'todo' || t.status === 'To Do').length;
  
  const completionProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const inProgressPercent = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0;
  const todoPercent = totalTasks > 0 ? Math.round((todoTasks / totalTasks) * 100) : 0;

  // Calculate time statistics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayEntries = timeEntries.filter(entry => {
    const clockIn = new Date(entry.clockIn);
    return clockIn >= today && entry.duration;
  });
  
  const thisWeekEntries = timeEntries.filter(entry => {
    const clockIn = new Date(entry.clockIn);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    return clockIn >= weekStart && entry.duration;
  });

  const hoursToday = todayEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / 60;
  const hoursThisWeek = thisWeekEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / 60;

  const progressItems: ProgressItem[] = [
    {
      icon: CheckCircle2,
      name: 'Completed Tasks',
      value: `${doneTasks}/${totalTasks}`,
      progress: completionProgress,
      color: 'bg-success'
    },
    {
      icon: Clock,
      name: 'In Progress',
      value: `${inProgressTasks} tasks`,
      progress: inProgressPercent,
      color: 'bg-primary'
    },
    {
      icon: Timer,
      name: 'Time Today',
      value: `${hoursToday.toFixed(1)}h`,
      progress: Math.min((hoursToday / 8) * 100, 100), // Assuming 8h workday
      color: 'bg-secondary'
    }
  ];

  if (loading) {
    return (
      <div className="glass-medium rounded-2xl p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4">Progress</h3>
        <Loader variant="section" size="sm" message="Loading progress insights..." />
      </div>
    );
  }

  return (
    <div className="glass-medium rounded-2xl p-6">
      <h3 className="text-lg font-bold text-text-primary mb-4">
        Progress
      </h3>
      <div className="space-y-4">
        {progressItems.map((item, idx) => (
          <div key={idx} className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-xl glass-light flex items-center justify-center ">
              <item.icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-text-primary">
                  {item.name}
                </span>
                <span className="text-xs text-text-tertiary font-medium">
                  {item.value}
                </span>
              </div>
              <div className="h-2 glass-subtle rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full  transition-all duration-300',
                    item.color
                  )}
                  style={{ width: `${item.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Additional stats */}
        <div className="pt-2 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-text-tertiary">
            <span>This Week</span>
            <span className="font-medium text-text-secondary">{hoursThisWeek.toFixed(1)}h</span>
          </div>
          <div className="flex items-center justify-between text-xs text-text-tertiary mt-1">
            <span>To Do</span>
            <span className="font-medium text-text-secondary">{todoTasks} tasks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
