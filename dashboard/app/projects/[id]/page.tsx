'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Users,
  Building,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  FileText,
  Download,
} from 'lucide-react';
import { api } from '../../lib/api';
import { cn, getRiskColor, formatDate } from '../../lib/utils';

interface ProjectDetail {
  project: {
    id: number;
    name: string;
    type: string;
    industry: string;
    team_size: string;
    timeline: string;
    score: number;
    risk_level: string;
    created_at: string;
    status: string;
  };
  analysis: {
    results: Record<string, string>;
    report: string;
    metadata: any;
  };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'report'>('overview');

  useEffect(() => {
    loadProject();
  }, [params.id]);

  const loadProject = async () => {
    try {
      const data = await api.getProject(Number(params.id));
      setProject(data);
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!project) return;
    const blob = new Blob([project.analysis.report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.project.name}_analysis.md`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">Project not found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-primary-500 hover:text-primary-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {project.project.name}
            </h1>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(project.project.created_at)}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Building className="w-4 h-4" />
                <span>{project.project.industry}</span>
              </span>
            </div>
          </div>
          <button
            onClick={downloadReport}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              'pb-4 border-b-2 font-medium transition-colors',
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={cn(
              'pb-4 border-b-2 font-medium transition-colors',
              activeTab === 'report'
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            Full Report
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Score Card */}
            <div className="bg-white dark:bg-card-dark rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                Scope Clarity Score
              </h3>
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 88}`}
                      strokeDashoffset={`${2 * Math.PI * 88 * (1 - (project.project.score || 0) / 100)}`}
                      className={cn(
                        project.project.score >= 80
                          ? 'text-green-500'
                          : project.project.score >= 60
                          ? 'text-blue-500'
                          : 'text-yellow-500'
                      )}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-5xl font-bold text-gray-900 dark:text-gray-100">
                      {project.project.score || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">out of 100</div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-center">
                <span className={cn('px-4 py-2 rounded-full font-medium', getRiskColor(project.project.risk_level))}>
                  Risk Level: {project.project.risk_level}
                </span>
              </div>
            </div>

            {/* Analysis Stages */}
            <div className="bg-white dark:bg-card-dark rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                Analysis Stages
              </h3>
              <div className="space-y-3">
                {Object.keys(project.analysis.results).map((stage, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    <span className="text-sm text-green-600 dark:text-green-400">Completed</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Details */}
            <div className="bg-white dark:bg-card-dark rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                Project Details
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mb-1">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">Project Type</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 ml-6">
                    {project.project.type}
                  </p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Team Size</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 ml-6">
                    {project.project.team_size}
                  </p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Timeline</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 ml-6">
                    {project.project.timeline}
                  </p>
                </div>
                <div>
                  <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mb-1">
                    <Building className="w-4 h-4" />
                    <span className="text-sm">Industry</span>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 ml-6">
                    {project.project.industry}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-card-dark rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full flex items-center space-x-2 px-4 py-2 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Re-analyze Project
                  </span>
                </button>
                <button className="w-full flex items-center space-x-2 px-4 py-2 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Share with Team
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Full Report Tab */
        <div className="bg-white dark:bg-card-dark rounded-2xl p-8 border border-gray-100 dark:border-gray-800">
          <div className="prose dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 dark:text-gray-300">
              {project.analysis.report}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
