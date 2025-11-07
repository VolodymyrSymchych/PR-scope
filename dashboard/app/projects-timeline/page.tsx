'use client';

import { useState } from 'react';
import { Calendar, Filter, Download, Plus, TrendingUp, Clock, Users, DollarSign } from 'lucide-react';

interface ProjectTimeline {
  id: number;
  name: string;
  category: string;
  startDate: string;
  endDate: string;
  progress: number;
  budget: number;
  team: number;
  status: 'on-track' | 'at-risk' | 'delayed' | 'completed';
  color: string;
}

export default function ProjectsTimelinePage() {
  const [viewMode, setViewMode] = useState<'timeline' | 'stats'>('timeline');
  const [timeRange, setTimeRange] = useState<'30' | '90' | '180' | 'year'>('90');

  const projects: ProjectTimeline[] = [
    {
      id: 1,
      name: 'Mobile Banking App',
      category: 'Development',
      startDate: '2024-11-01',
      endDate: '2024-12-31',
      progress: 65,
      budget: 120000,
      team: 8,
      status: 'on-track',
      color: 'bg-blue-500'
    },
    {
      id: 2,
      name: 'E-commerce Platform',
      category: 'Development',
      startDate: '2024-10-15',
      endDate: '2024-12-20',
      progress: 78,
      budget: 95000,
      team: 6,
      status: 'on-track',
      color: 'bg-green-500'
    },
    {
      id: 3,
      name: 'Marketing Campaign Q4',
      category: 'Marketing',
      startDate: '2024-11-10',
      endDate: '2024-12-25',
      progress: 45,
      budget: 45000,
      team: 4,
      status: 'at-risk',
      color: 'bg-yellow-500'
    },
    {
      id: 4,
      name: 'Data Migration Project',
      category: 'Infrastructure',
      startDate: '2024-11-05',
      endDate: '2025-01-15',
      progress: 32,
      budget: 80000,
      team: 5,
      status: 'delayed',
      color: 'bg-red-500'
    },
    {
      id: 5,
      name: 'Customer Portal Redesign',
      category: 'Design',
      startDate: '2024-10-01',
      endDate: '2024-11-30',
      progress: 100,
      budget: 55000,
      team: 4,
      status: 'completed',
      color: 'bg-purple-500'
    },
  ];

  const stats = {
    totalProjects: projects.length,
    onTrack: projects.filter(p => p.status === 'on-track').length,
    atRisk: projects.filter(p => p.status === 'at-risk').length,
    totalBudget: projects.reduce((sum, p) => sum + p.budget, 0),
    avgProgress: Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'at-risk': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'delayed': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      case 'completed': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Project Timeline</h1>
          <p className="text-text-secondary mt-1">Track all projects in one visual timeline</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-surface dark:bg-surface-elevated border border-border rounded-lg hover:bg-background dark:hover:bg-surface transition-colors">
            <Filter className="w-4 h-4 text-text-secondary" />
            <span className="text-text-primary">Filter</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-surface dark:bg-surface-elevated border border-border rounded-lg hover:bg-background dark:hover:bg-surface transition-colors">
            <Download className="w-4 h-4 text-text-secondary" />
            <span className="text-text-primary">Export</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors">
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface dark:bg-surface-elevated rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-sm text-text-tertiary mb-1">Total Projects</p>
          <p className="text-3xl font-bold text-text-primary">{stats.totalProjects}</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">+12% from last month</p>
        </div>

        <div className="bg-surface dark:bg-surface-elevated rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-sm text-text-tertiary mb-1">On Track</p>
          <p className="text-3xl font-bold text-text-primary">{stats.onTrack}/{stats.totalProjects}</p>
          <p className="text-xs text-text-tertiary mt-2">Projects progressing well</p>
        </div>

        <div className="bg-surface dark:bg-surface-elevated rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm text-text-tertiary mb-1">Avg. Progress</p>
          <p className="text-3xl font-bold text-text-primary">{stats.avgProgress}%</p>
          <div className="mt-2 h-1.5 bg-background dark:bg-surface rounded-full overflow-hidden">
            <div className="h-full bg-purple-500" style={{ width: `${stats.avgProgress}%` }}></div>
          </div>
        </div>

        <div className="bg-surface dark:bg-surface-elevated rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-orange-600 dark:text-orange-400" />
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
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'timeline'
                ? 'bg-primary text-white'
                : 'bg-surface dark:bg-surface-elevated text-text-secondary hover:text-text-primary'
            }`}
          >
            Timeline View
          </button>
          <button
            onClick={() => setViewMode('stats')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'stats'
                ? 'bg-primary text-white'
                : 'bg-surface dark:bg-surface-elevated text-text-secondary hover:text-text-primary'
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
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {range === 'year' ? '1Y' : `${range}D`}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="bg-surface dark:bg-surface-elevated rounded-xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
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
          {projects.map((project, index) => (
            <div key={project.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 w-80">
                  <div className="flex items-center space-x-3">
                    <div className={`w-1 h-12 rounded-full ${project.color}`}></div>
                    <div>
                      <h4 className="font-semibold text-text-primary">{project.name}</h4>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-xs text-text-tertiary">{project.category}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(project.status)}`}>
                          {project.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 px-8">
                  <div className="relative h-12 bg-background dark:bg-surface rounded-lg overflow-hidden">
                    {/* Timeline bar */}
                    <div
                      className={`absolute top-0 bottom-0 ${project.color} opacity-20 rounded-lg`}
                      style={{
                        left: '10%',
                        width: '60%',
                      }}
                    ></div>
                    {/* Progress bar */}
                    <div
                      className={`absolute top-0 bottom-0 ${project.color} rounded-lg flex items-center justify-center`}
                      style={{
                        left: '10%',
                        width: `${(60 * project.progress) / 100}%`,
                      }}
                    >
                      <span className="text-xs font-semibold text-white">
                        {project.progress}%
                      </span>
                    </div>
                    {/* Start/End markers */}
                    <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                      <span className="text-xs text-text-tertiary bg-surface dark:bg-surface-elevated px-2 py-0.5 rounded">
                        {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-xs text-text-tertiary bg-surface dark:bg-surface-elevated px-2 py-0.5 rounded">
                        {new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-right">
                    <p className="text-text-tertiary text-xs">Budget</p>
                    <p className="font-semibold text-text-primary">${(project.budget / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="text-right">
                    <p className="text-text-tertiary text-xs">Team</p>
                    <p className="font-semibold text-text-primary">{project.team} members</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project Details Table */}
      <div className="bg-surface dark:bg-surface-elevated rounded-xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-text-primary">Project Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background dark:bg-surface">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-tertiary uppercase">Project Name</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-tertiary uppercase">Start Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-tertiary uppercase">End Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-tertiary uppercase">Progress</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-tertiary uppercase">Budget</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-text-tertiary uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-background dark:hover:bg-surface transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${project.color}`}></div>
                      <span className="font-medium text-text-primary">{project.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-secondary">{new Date(project.startDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-text-secondary">{new Date(project.endDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 h-2 bg-background dark:bg-surface rounded-full overflow-hidden max-w-[100px]">
                        <div className={`h-full ${project.color}`} style={{ width: `${project.progress}%` }}></div>
                      </div>
                      <span className="text-sm text-text-primary font-medium">{project.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-primary font-medium">${project.budget.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                      {project.status.replace('-', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
