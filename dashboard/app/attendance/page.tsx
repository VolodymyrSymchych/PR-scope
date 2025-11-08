'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar, Play, Square, Download } from 'lucide-react';
import axios from 'axios';

interface Task {
  id: number;
  title: string;
  projectId?: number | null;
}

interface TimeEntry {
  id: number;
  userId: number;
  taskId?: number | null;
  projectId?: number | null;
  clockIn: string;
  clockOut?: string | null;
  duration?: number | null;
  notes?: string | null;
}

export default function AttendancePage() {
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentSession, setCurrentSession] = useState<TimeEntry | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
    loadTimeEntries();
    checkActiveSession();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await axios.get('/api/tasks');
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const loadTimeEntries = async () => {
    try {
      const response = await axios.get('/api/attendance');
      setTimeEntries(response.data.timeEntries || []);
    } catch (error) {
      console.error('Failed to load time entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkActiveSession = async () => {
    try {
      const response = await axios.get('/api/attendance');
      const entries = response.data.timeEntries || [];
      const activeEntry = entries.find((e: TimeEntry) => !e.clockOut);
      if (activeEntry) {
        setIsClockedIn(true);
        setCurrentSession(activeEntry);
      }
    } catch (error) {
      console.error('Failed to check active session:', error);
    }
  };

  const handleClockInOut = async () => {
    if (isClockedIn) {
      // Clock out
      try {
        await axios.put('/api/attendance', {
          clock_out: new Date().toISOString(),
        });
        setIsClockedIn(false);
        setCurrentSession(null);
        setSelectedTaskId('');
        loadTimeEntries();
      } catch (error) {
        console.error('Failed to clock out:', error);
        alert('Failed to clock out. Please try again.');
      }
    } else {
      // Clock in
      if (!selectedTaskId) {
        alert('Please select a task before clocking in.');
        return;
      }
      try {
        const taskId = parseInt(selectedTaskId);
        const selectedTask = tasks.find(t => t.id === taskId);
        const response = await axios.post('/api/attendance', {
          task_id: taskId,
          project_id: selectedTask?.projectId || null,
          clock_in: new Date().toISOString(),
        });
        setIsClockedIn(true);
        setCurrentSession(response.data.timeEntry);
        loadTimeEntries();
      } catch (error) {
        console.error('Failed to clock in:', error);
        alert('Failed to clock in. Please try again.');
      }
    }
  };

  const formatDuration = (minutes: number | null | undefined) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const today = new Date().toISOString().split('T')[0];
  const todayEntries = timeEntries.filter(e => 
    new Date(e.clockIn).toISOString().split('T')[0] === today
  );
  const totalHoursToday = todayEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
  const totalHoursWeek = timeEntries.reduce((sum, e) => sum + (e.duration || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Attendance</h1>
          <p className="text-text-secondary mt-1">
            Track your working hours and time logs
          </p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 glass-light hover:glass-medium rounded-lg transition-all">
          <Download className="w-5 h-5 text-text-secondary" />
          <span className="text-text-primary">Export Report</span>
        </button>
      </div>

      {/* Clock In/Out Section */}
      <div className="glass-medium rounded-2xl p-8 border border-[#FF6B4A]/20">
        <div className="space-y-4">
          {!isClockedIn && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Select Task *
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg glass-medium border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Choose a task...</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-text-primary mb-2">
                {isClockedIn ? 'Currently Working' : 'Ready to Start?'}
              </h3>
              <p className="text-text-secondary">
                {isClockedIn && currentSession
                  ? `Started at ${formatTime(currentSession.clockIn)}`
                  : 'Select a task and click below to clock in'}
              </p>
            </div>
            <button
              onClick={handleClockInOut}
              disabled={!isClockedIn && !selectedTaskId}
              className={`flex items-center space-x-3 px-8 py-4 rounded-xl text-white font-semibold text-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                isClockedIn
                  ? 'bg-red-500/80 hover:bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                  : 'bg-[#00D66B]/80 hover:bg-[#00D66B] shadow-[0_0_20px_rgba(0,214,107,0.4)]'
              }`}
            >
              {isClockedIn ? (
                <>
                  <Square className="w-6 h-6" />
                  <span>Clock Out</span>
                </>
              ) : (
                <>
                  <Play className="w-6 h-6" />
                  <span>Clock In</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-medium glass-hover rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 rounded-xl glass-light flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            </div>
            <div>
              <p className="text-sm text-text-tertiary">Today</p>
              <p className="text-2xl font-bold text-text-primary">{formatDuration(totalHoursToday)}</p>
            </div>
          </div>
        </div>

        <div className="glass-medium glass-hover rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 rounded-xl glass-light flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#00D66B] drop-shadow-[0_0_8px_rgba(0,214,107,0.5)]" />
            </div>
            <div>
              <p className="text-sm text-text-tertiary">This Week</p>
              <p className="text-2xl font-bold text-text-primary">{formatDuration(totalHoursWeek)}</p>
            </div>
          </div>
        </div>

        <div className="glass-medium glass-hover rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 rounded-xl glass-light flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
            </div>
            <div>
              <p className="text-sm text-text-tertiary">This Month</p>
              <p className="text-2xl font-bold text-text-primary">{formatDuration(totalHoursWeek * 4)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setView('daily')}
          className={`px-4 py-2 rounded-lg transition-all ${
            view === 'daily'
              ? 'glass-button text-white'
              : 'glass-light text-text-secondary hover:glass-medium hover:text-text-primary'
          }`}
        >
          Daily
        </button>
        <button
          onClick={() => setView('weekly')}
          className={`px-4 py-2 rounded-lg transition-all ${
            view === 'weekly'
              ? 'glass-button text-white'
              : 'glass-light text-text-secondary hover:glass-medium hover:text-text-primary'
          }`}
        >
          Weekly
        </button>
        <button
          onClick={() => setView('monthly')}
          className={`px-4 py-2 rounded-lg transition-all ${
            view === 'monthly'
              ? 'glass-button text-white'
              : 'glass-light text-text-secondary hover:glass-medium hover:text-text-primary'
          }`}
        >
          Monthly
        </button>
      </div>

      {/* Time Entries */}
      <div className="glass-medium rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-text-primary">Time Entries</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="glass-subtle">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Clock In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Clock Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {timeEntries.map((entry) => {
                const task = tasks.find(t => t.id === entry.taskId);
                return (
                  <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm text-text-primary">{task?.title || 'No task'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-text-primary">{formatTime(entry.clockIn)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-text-primary">
                        {entry.clockOut ? formatTime(entry.clockOut) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        {formatDuration(entry.duration)}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {timeEntries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-text-tertiary">
                    No time entries yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
