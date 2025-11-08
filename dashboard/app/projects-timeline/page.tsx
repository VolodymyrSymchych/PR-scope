'use client';

import { useState, useEffect } from 'react';
import { Calendar, Filter, Download, Plus, TrendingUp, Clock, Users, DollarSign } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface Project {
  id: number;
  name: string;
  type?: string | null;
  industry?: string | null;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  budget?: number | null;
  timeline?: string | null;
  createdAt: string;
}

export default function ProjectsTimelinePage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'timeline' | 'stats'>('timeline');
  const [timeRange, setTimeRange] = useState<'30' | '90' | '180' | 'year'>('90');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (project: Project): number => {
    if (!project.startDate || !project.endDate) return 0;
    const start = new Date(project.startDate).getTime();
    const end = new Date(project.endDate).getTime();
    const now = new Date().getTime();
    if (now < start) return 0;
    if (now > end) return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  };

  const getStatusColor = (status: string, progress: number) => {
    if (status === 'completed') return 'bg-purple-500';
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusLabel = (status: string, progress: number) => {
    if (status === 'completed') return 'completed';
    if (progress >= 80) return 'on-track';
    if (progress >= 50) return 'on-track';
    if (progress >= 30) return 'at-risk';
    return 'delayed';
  };

  const stats = {
    totalProjects: projects.length,
    onTrack: projects.filter(p => {
      const progress = calculateProgress(p);
      return progress >= 50 && p.status !== 'completed';
    }).length,
    atRisk: projects.filter(p => {
      const progress = calculateProgress(p);
      return progress < 50 && progress > 0 && p.status !== 'completed';
    }).length,
    totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
    avgProgress: projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + calculateProgress(p), 0) / projects.length)
      : 0,
  };

  const getStatusBadgeColor = (status: string, progress: number) => {
    const label = getStatusLabel(status, progress);
    switch (label) {
      case 'on-track': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'at-risk': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'delayed': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      case 'completed': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
    }
  };

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
          <h1 className="text-3xl font-bold gradient-text">Project Timeline</h1>
          <p className="text-text-secondary mt-1">Track all projects in one visual timeline</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 glass-light hover:glass-medium rounded-lg transition-all">
            <Filter className="w-4 h-4 text-text-secondary" />
            <span className="text-text-primary">Filter</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 glass-light hover:glass-medium rounded-lg transition-all">
            <Download className="w-4 h-4 text-text-secondary" />
            <span className="text-text-primary">Export</span>
          </button>
          <button
            onClick={() => router.push('/projects/new')}
            className="flex items-center space-x-2 px-4 py-2 glass-button text-white rounded-lg"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-medium glass-hover rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg glass-light flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            </div>
            <TrendingUp className="w-4 h-4 text-[#00D66B]" />
          </div>
          <p className="text-sm text-text-tertiary mb-1">Total Projects</p>
          <p className="text-3xl font-bold text-text-primary">{stats.totalProjects}</p>
        </div>

        <div className="glass-medium glass-hover rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg glass-light flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#00D66B] drop-shadow-[0_0_8px_rgba(0,214,107,0.5)]" />
            </div>
          </div>
          <p className="text-sm text-text-tertiary mb-1">On Track</p>
          <p className="text-3xl font-bold text-text-primary">{stats.onTrack}/{stats.totalProjects}</p>
          <p className="text-xs text-text-tertiary mt-2">Projects progressing well</p>
        </div>

        <div className="glass-medium glass-hover rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg glass-light flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
            </div>
          </div>
          <p className="text-sm text-text-tertiary mb-1">Avg. Progress</p>
          <p className="text-3xl font-bold text-text-primary">{stats.avgProgress}%</p>
          <div className="mt-2 h-1.5 glass-subtle rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]" style={{ width: `${stats.avgProgress}%` }}></div>
          </div>
        </div>

        <div className="glass-medium glass-hover rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg glass-light flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#FF6B4A] drop-shadow-[0_0_8px_rgba(255,107,74,0.5)]" />
            </div>
          </div>
          <p className="text-sm text-text-tertiary mb-1">Total Budget</p>
          <p className="text-3xl font-bold text-text-primary">${(stats.totalBudget / 1000).toFixed(0)}K</p>
          <p className="text-xs text-text-tertiary mt-2">Across all projects</p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-4 py-2 rounded-lg transition-all ${
              viewMode === 'timeline'
                ? 'glass-button text-white'
                : 'glass-light text-text-secondary hover:glass-medium hover:text-text-primary'
            }`}
          >
            Timeline View
          </button>
          <button
            onClick={() => setViewMode('stats')}
            className={`px-4 py-2 rounded-lg transition-all ${
              viewMode === 'stats'
                ? 'glass-button text-white'
                : 'glass-light text-text-secondary hover:glass-medium hover:text-text-primary'
            }`}
          >
            Statistics
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-text-tertiary">Time Range:</span>
          {['30', '90', '180', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                timeRange === range
                  ? 'glass-button text-white'
                  : 'glass-subtle text-text-secondary hover:glass-light hover:text-text-primary'
              }`}
            >
              {range === 'year' ? '1Y' : `${range}D`}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Chart */}
      {projects.length === 0 ? (
        <div className="glass-medium rounded-xl p-12 text-center">
          <Calendar className="w-16 h-16 text-text-tertiary mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">No Projects Yet</h3>
          <p className="text-text-secondary mb-6">Create your first project to see it on the timeline</p>
          <button
            onClick={() => router.push('/projects/new')}
            className="glass-button px-6 py-3 rounded-lg text-white"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="glass-medium rounded-xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">Project Timeline Overview</h3>
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded bg-green-500"></div>
                  <span className="text-text-tertiary">On Track</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded bg-yellow-500"></div>
                  <span className="text-text-tertiary">At Risk</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded bg-red-500"></div>
                  <span className="text-text-tertiary">Delayed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded bg-purple-500"></div>
                  <span className="text-text-tertiary">Completed</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {projects.map((project) => {
              const progress = calculateProgress(project);
              const color = getStatusColor(project.status, progress);
              const statusLabel = getStatusLabel(project.status, progress);
              const startDate = project.startDate ? new Date(project.startDate) : new Date(project.createdAt);
              const endDate = project.endDate ? new Date(project.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

              return (
                <div key={project.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 w-80">
                      <div className="flex items-center space-x-3">
                        <div className={`w-1 h-12 rounded-full ${color}`}></div>
                        <div>
                          <h4 className="font-semibold text-text-primary">{project.name}</h4>
                          <div className="flex items-center space-x-3 mt-1">
                            {project.type && (
                              <span className="text-xs text-text-tertiary">{project.type}</span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadgeColor(project.status, progress)}`}>
                              {statusLabel.replace('-', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 px-8">
                      <div className="relative h-12 glass-subtle rounded-lg overflow-hidden">
                        <div
                          className={`absolute top-0 bottom-0 ${color} opacity-20 rounded-lg`}
                          style={{
                            left: '10%',
                            width: '60%',
                          }}
                        ></div>
                        <div
                          className={`absolute top-0 bottom-0 ${color} rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,107,74,0.3)]`}
                          style={{
                            left: '10%',
                            width: `${(60 * progress) / 100}%`,
                          }}
                        >
                          <span className="text-xs font-semibold text-white drop-shadow-lg">
                            {progress}%
                          </span>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                          <span className="text-xs text-text-tertiary glass-light px-2 py-0.5 rounded">
                            {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-xs text-text-tertiary glass-light px-2 py-0.5 rounded">
                            {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm">
                      {project.budget && (
                        <div className="text-right">
                          <p className="text-text-tertiary text-xs">Budget</p>
                          <p className="font-semibold text-text-primary">${(project.budget / 1000).toFixed(0)}K</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Project Details Table */}
      <div className="glass-medium rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-text-primary">Project Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="glass-subtle">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-tertiary uppercase">Project Name</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-tertiary uppercase">Start Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-tertiary uppercase">End Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-tertiary uppercase">Progress</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-tertiary uppercase">Budget</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-tertiary uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {projects.map((project) => {
                const progress = calculateProgress(project);
                const color = getStatusColor(project.status, progress);
                const statusLabel = getStatusLabel(project.status, progress);
                const startDate = project.startDate ? new Date(project.startDate) : new Date(project.createdAt);
                const endDate = project.endDate ? new Date(project.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                return (
                  <tr key={project.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${color} shadow-[0_0_8px_rgba(255,107,74,0.5)]`}></div>
                        <span className="font-medium text-text-primary">{project.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{startDate.toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-text-secondary">{endDate.toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-2 glass-subtle rounded-full overflow-hidden max-w-[100px]">
                          <div className={`h-full ${color} shadow-[0_0_10px_rgba(255,107,74,0.4)]`} style={{ width: `${progress}%` }}></div>
                        </div>
                        <span className="text-sm text-text-primary font-medium">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-primary font-medium">
                      {project.budget ? `$${project.budget.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(project.status, progress)}`}>
                        {statusLabel.replace('-', ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
