'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
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
  Share2,
  RefreshCw,
  Edit,
} from 'lucide-react';
import { ProjectBudgetTracking } from '@/components/ProjectBudgetTracking';
import { FileUploader } from '@/components/FileUploader';
import { FileList } from '@/components/FileList';
import { ProjectTeamManagement } from '@/components/ProjectTeamManagement';
import { EditProjectModal } from '@/components/EditProjectModal';
import { api } from '@/lib/api';
import { cn, getRiskColor, formatDate } from '@/lib/utils';

// Lazy load heavy chart components
const InvoicesAndCashFlow = dynamic(() => import('@/components/InvoicesAndCashFlow').then(m => ({ default: m.InvoicesAndCashFlow })), {
  ssr: false,
  loading: () => <div className="glass-light rounded-xl p-5 h-96 animate-pulse" />
});

const CashFlowSummary = dynamic(() => import('@/components/CashFlowSummary').then(m => ({ default: m.CashFlowSummary })), {
  ssr: false,
  loading: () => <div className="glass-light rounded-xl p-5 h-64 animate-pulse" />
});

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
    team_id?: number;
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
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'finance' | 'files' | 'report'>('overview');
  const [filesRefreshKey, setFilesRefreshKey] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <div className="glass-medium rounded-2xl p-12 max-w-md mx-auto border border-white/10">
          <AlertTriangle className="w-16 h-16 text-warning mx-auto mb-4" />
          <h3 className="text-xl font-bold text-text-primary mb-2">Project not found</h3>
          <p className="text-text-secondary mb-6">The project you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.back()}
            className="glass-light px-6 py-2.5 rounded-lg hover:glass-medium transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-105 active:scale-95 text-text-primary font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const getRiskColorClass = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'low':
        return 'text-success bg-success/10 border-success/20';
      case 'medium':
        return 'text-warning bg-warning/10 border-warning/20';
      case 'high':
        return 'text-danger bg-danger/10 border-danger/20';
      default:
        return 'text-text-secondary bg-white/5 border-white/10';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-warning';
    return 'text-danger';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="glass-medium rounded-2xl p-5 border border-white/10">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-text-secondary hover:text-text-primary mb-5 transition-colors duration-200 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="font-medium">Back to Projects</span>
        </button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-text-primary mb-2.5">
              {project.project.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
              <span className="flex items-center space-x-2 glass-subtle px-2.5 py-1.5 rounded-lg">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(project.project.created_at)}</span>
              </span>
              <span className="flex items-center space-x-2 glass-subtle px-2.5 py-1.5 rounded-lg">
                <Building className="w-3.5 h-3.5" />
                <span>{project.project.industry}</span>
              </span>
              <span className={cn(
                'px-2.5 py-1.5 rounded-lg font-medium text-xs uppercase tracking-wider border',
                getRiskColorClass(project.project.risk_level)
              )}>
                {project.project.risk_level} Risk
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center space-x-2 px-4 py-2 glass-light hover:glass-medium rounded-lg transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-105 active:scale-95"
            >
              <Edit className="w-4 h-4 text-text-primary" />
              <span className="font-medium text-text-primary">Edit</span>
            </button>
            <button
              onClick={downloadReport}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-105 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span className="font-medium">Download Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-medium rounded-2xl border border-white/10 overflow-hidden">
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              'flex-1 px-4 py-3 font-semibold text-sm transition-all duration-200',
              activeTab === 'overview'
                ? 'text-primary bg-primary/5 border-b-2 border-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={cn(
              'flex-1 px-4 py-3 font-semibold text-sm transition-all duration-200',
              activeTab === 'team'
                ? 'text-primary bg-primary/5 border-b-2 border-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
            )}
          >
            Team
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={cn(
              'flex-1 px-4 py-3 font-semibold text-sm transition-all duration-200',
              activeTab === 'finance'
                ? 'text-primary bg-primary/5 border-b-2 border-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
            )}
          >
            Invoices & Cash Flow
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={cn(
              'flex-1 px-4 py-3 font-semibold text-sm transition-all duration-200',
              activeTab === 'files'
                ? 'text-primary bg-primary/5 border-b-2 border-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
            )}
          >
            Files
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={cn(
              'flex-1 px-4 py-3 font-semibold text-sm transition-all duration-200',
              activeTab === 'report'
                ? 'text-primary bg-primary/5 border-b-2 border-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
            )}
          >
            Full Report
          </button>
        </div>

        <div className="p-5">
          {/* Content */}
          {activeTab === 'overview' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-5">
                {/* Cash Flow Summary - moved from sidebar */}
                <CashFlowSummary projectId={project.project.id} />

                {/* Analysis Stages */}
                <div className="glass-light rounded-xl p-5 border border-white/10">
                  <h3 className="text-base font-bold text-text-primary mb-4 flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span>Analysis Stages</span>
                  </h3>
                  <div className="space-y-2.5">
                    {Object.keys(project.analysis.results).map((stage, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg glass-subtle border border-white/5 hover:border-success/20 transition-all duration-200 group"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                            <CheckCircle className="w-3.5 h-3.5 text-success" />
                          </div>
                          <span className="font-medium text-text-primary text-sm">
                            {stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-success uppercase tracking-wider">Completed</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-5">
                {/* Budget Tracking */}
                <ProjectBudgetTracking
                  projectId={project.project.id}
                  projectBudget={(project.project as any).budget}
                  projectStartDate={(project.project as any).start_date}
                  projectEndDate={(project.project as any).end_date}
                />

                {/* Score Card - moved from main content */}
                <div className="glass-light rounded-xl p-5 border border-white/10">
                  <h3 className="text-base font-bold text-text-primary mb-4 flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span>Scope Clarity Score</span>
                  </h3>

                  <div className="flex items-center justify-center py-4">
                    <div className="relative w-36 h-36">
                      {/* Outer glow ring */}
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-xl"></div>

                      {/* SVG Circle */}
                      <svg className="w-full h-full transform -rotate-90 relative z-10">
                        <circle
                          cx="72"
                          cy="72"
                          r="58"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-white/5"
                        />
                        <circle
                          cx="72"
                          cy="72"
                          r="58"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 58}`}
                          strokeDashoffset={`${2 * Math.PI * 58 * (1 - (project.project.score || 0) / 100)}`}
                          className={cn(
                            'transition-all duration-1000 ease-out',
                            getScoreColor(project.project.score || 0)
                          )}
                          strokeLinecap="round"
                        />
                      </svg>

                      {/* Score Display */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className={cn(
                          'text-3xl font-bold mb-0.5',
                          getScoreColor(project.project.score || 0)
                        )}>
                          {project.project.score || 0}
                        </div>
                        <div className="text-[10px] text-text-tertiary font-medium">out of 100</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Details */}
                <div className="glass-light rounded-xl p-5 border border-white/10">
                  <h3 className="text-base font-bold text-text-primary mb-4 flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>Project Details</span>
                  </h3>
                  <div className="space-y-3.5">
                    <div className="group">
                      <div className="flex items-center space-x-2 text-text-tertiary mb-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium uppercase tracking-wider">Project Type</span>
                      </div>
                      <p className="font-semibold text-text-primary text-sm ml-5 group-hover:text-primary transition-colors duration-200">
                        {project.project.type}
                      </p>
                    </div>

                    <div className="h-px bg-white/5"></div>

                    <div className="group">
                      <div className="flex items-center space-x-2 text-text-tertiary mb-1.5">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium uppercase tracking-wider">Team Size</span>
                      </div>
                      <p className="font-semibold text-text-primary text-sm ml-5 group-hover:text-primary transition-colors duration-200">
                        {project.project.team_size}
                      </p>
                    </div>

                    <div className="h-px bg-white/5"></div>

                    <div className="group">
                      <div className="flex items-center space-x-2 text-text-tertiary mb-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium uppercase tracking-wider">Timeline</span>
                      </div>
                      <p className="font-semibold text-text-primary text-sm ml-5 group-hover:text-primary transition-colors duration-200">
                        {project.project.timeline}
                      </p>
                    </div>

                    <div className="h-px bg-white/5"></div>

                    <div className="group">
                      <div className="flex items-center space-x-2 text-text-tertiary mb-1.5">
                        <Building className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium uppercase tracking-wider">Industry</span>
                      </div>
                      <p className="font-semibold text-text-primary text-sm ml-5 group-hover:text-primary transition-colors duration-200">
                        {project.project.industry}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-light rounded-xl p-5 border border-white/10">
                  <h3 className="text-base font-bold text-text-primary mb-3.5">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <button className="w-full flex items-center space-x-2.5 px-3 py-2.5 text-left rounded-lg glass-subtle hover:glass-medium border border-white/5 hover:border-primary/20 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-105 active:scale-95 group">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-200">
                        <RefreshCw className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors duration-200">
                        Re-analyze Project
                      </span>
                    </button>

                    <button className="w-full flex items-center space-x-2.5 px-3 py-2.5 text-left rounded-lg glass-subtle hover:glass-medium border border-white/5 hover:border-primary/20 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-105 active:scale-95 group">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-200">
                        <Share2 className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors duration-200">
                        Share with Team
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'team' ? (
            <ProjectTeamManagement
              projectId={project.project.id}
              teamId={project.project.team_id}
            />
          ) : activeTab === 'finance' ? (
            <InvoicesAndCashFlow projectId={project.project.id} />
          ) : activeTab === 'files' ? (
            <div className="space-y-5">
              <div className="glass-light rounded-xl p-5 border border-white/10">
                <h3 className="text-base font-bold text-text-primary mb-4">Upload Files</h3>
                <FileUploader
                  projectId={project.project.id}
                  onUploadSuccess={() => setFilesRefreshKey(prev => prev + 1)}
                />
              </div>
              <div className="glass-light rounded-xl p-5 border border-white/10">
                <h3 className="text-base font-bold text-text-primary mb-4">Project Files</h3>
                <FileList
                  key={filesRefreshKey}
                  projectId={project.project.id}
                  onDelete={() => setFilesRefreshKey(prev => prev + 1)}
                />
              </div>
            </div>
          ) : (
            /* Full Report Tab */
            <div className="glass-light rounded-xl p-6 border border-white/10">
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-text-secondary leading-relaxed bg-black/20 p-5 rounded-lg border border-white/5">
                  {project.analysis.report}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Project Modal */}
      {project && (
        <EditProjectModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            setShowEditModal(false);
            loadProject();
          }}
          project={{
            id: project.project.id,
            name: project.project.name,
            type: project.project.type,
            industry: project.project.industry,
            team_size: project.project.team_size,
            timeline: project.project.timeline,
            status: project.project.status,
            budget: (project.project as any).budget,
            start_date: (project.project as any).start_date,
            end_date: (project.project as any).end_date,
            team_id: project.project.team_id,
          }}
        />
      )}
    </div>
  );
}
