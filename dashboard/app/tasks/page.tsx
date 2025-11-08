'use client';

import { useEffect, useState } from 'react';
import { Plus, Filter, Search, Calendar, User } from 'lucide-react';
import axios from 'axios';
import { Task } from '@/lib/tasks-api';

interface Project {
  id: number;
  name: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    project_id: '' as string | number,
    assignee: '',
    due_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'todo' as 'todo' | 'in_progress' | 'done'
  });

  useEffect(() => {
    loadProjects();
    loadTasks();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await axios.get('/api/tasks');
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const taskData = {
        ...newTask,
        project_id: newTask.project_id ? parseInt(newTask.project_id as string) : undefined,
      };
      await axios.post('/api/tasks', taskData);
      setNewTask({
        title: '',
        description: '',
        project_id: '',
        assignee: '',
        due_date: '',
        priority: 'medium',
        status: 'todo'
      });
      setShowNewTaskForm(false);
      loadTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task. Please try again.');
    }
  };

  const updateTaskStatus = async (taskId: number, status: 'todo' | 'in_progress' | 'done') => {
    try {
      await axios.put(`/api/tasks/${taskId}`, { status });
      loadTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const todoTasks = tasks.filter(t => t.status === 'todo' || t.status === 'Todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'In Progress');
  const doneTasks = tasks.filter(t => t.status === 'done' || t.status === 'Done');

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
          <h1 className="text-3xl font-bold text-text-primary">Tasks</h1>
          <p className="text-text-secondary mt-1">
            Manage and track your tasks
          </p>
        </div>
        <button
          onClick={() => setShowNewTaskForm(!showNewTaskForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>New Task</span>
        </button>
      </div>

      {/* New Task Form */}
      {showNewTaskForm && (
        <div className="glass-medium rounded-2xl p-6 border border-white/10">
          <form onSubmit={createTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full px-4 py-3 rounded-lg glass-medium border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full px-4 py-3 rounded-lg glass-medium border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Project
                </label>
                <select
                  value={newTask.project_id}
                  onChange={(e) => setNewTask({ ...newTask, project_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg glass-medium border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">No Project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Priority
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-lg glass-medium border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Assignee
                </label>
                <input
                  type="text"
                  value={newTask.assignee}
                  onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg glass-medium border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Initials (e.g., AR)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg glass-medium border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowNewTaskForm(false)}
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* To Do Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span>To Do</span>
              <span className="text-text-tertiary text-sm">({todoTasks.length})</span>
            </h3>
          </div>
          <div className="space-y-3">
            {todoTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={updateTaskStatus}
                getPriorityColor={getPriorityColor}
              />
            ))}
            {todoTasks.length === 0 && (
              <div className="text-center py-8 text-text-tertiary">
                No tasks
              </div>
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>In Progress</span>
              <span className="text-text-tertiary text-sm">({inProgressTasks.length})</span>
            </h3>
          </div>
          <div className="space-y-3">
            {inProgressTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={updateTaskStatus}
                getPriorityColor={getPriorityColor}
              />
            ))}
            {inProgressTasks.length === 0 && (
              <div className="text-center py-8 text-text-tertiary">
                No tasks
              </div>
            )}
          </div>
        </div>

        {/* Done Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Done</span>
              <span className="text-text-tertiary text-sm">({doneTasks.length})</span>
            </h3>
          </div>
          <div className="space-y-3">
            {doneTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={updateTaskStatus}
                getPriorityColor={getPriorityColor}
              />
            ))}
            {doneTasks.length === 0 && (
              <div className="text-center py-8 text-text-tertiary">
                No tasks
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: any;
  onStatusChange: (taskId: number, status: 'todo' | 'in_progress' | 'done') => void;
  getPriorityColor: (priority: string) => string;
}

function TaskCard({ task, onStatusChange, getPriorityColor }: TaskCardProps) {
  return (
    <div className="glass-medium rounded-xl p-4 border border-white/10 hover:glass-light transition-all duration-200 hover:scale-[1.02]">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h4 className="font-semibold text-text-primary">{task.title}</h4>
          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority || 'medium')}`}>
            {task.priority || 'medium'}
          </span>
        </div>

        {task.description && (
          <p className="text-sm text-text-secondary line-clamp-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm">
          {(task.dueDate || task.due_date) && (
            <div className="flex items-center space-x-2 text-text-tertiary">
              <Calendar className="w-4 h-4" />
              <span>{new Date((task.dueDate || task.due_date) as string).toLocaleDateString()}</span>
            </div>
          )}
          {task.assignee && (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-semibold">
                {task.assignee}
              </div>
            </div>
          )}
        </div>

        {/* Status change buttons */}
        <div className="flex gap-2 pt-2 border-t border-white/10">
          {task.status !== 'todo' && (
            <button
              onClick={() => onStatusChange(task.id, 'todo')}
              className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg glass-light text-text-primary hover:glass-medium transition-all hover:scale-105"
            >
              📋 To Do
            </button>
          )}
          {task.status !== 'in_progress' && (
            <button
              onClick={() => onStatusChange(task.id, 'in_progress')}
              className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-all hover:scale-105"
            >
              ⚡ In Progress
            </button>
          )}
          {task.status !== 'done' && (
            <button
              onClick={() => onStatusChange(task.id, 'done')}
              className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-all hover:scale-105"
            >
              ✓ Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
