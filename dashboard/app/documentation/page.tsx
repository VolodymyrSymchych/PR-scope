'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText, Download, Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { generateReportPDF } from '@/lib/report-pdf';
import { Loader } from '@/components/Loader';

interface Report {
  id: number;
  title: string;
  content: string;
  type: 'project_status' | 'analysis' | 'financial_summary' | 'custom';
  status: 'draft' | 'published' | 'archived';
  projectId: number | null;
  userId: number;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    username: string;
  };
}

export default function DocumentationPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await axios.get('/api/reports');
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Failed to load documentation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await axios.delete(`/api/reports/${reportId}`);
      loadReports();
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const handleExportPDF = async (report: Report, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await generateReportPDF(report);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'project_status': return 'Project Status';
      case 'analysis': return 'Analysis';
      case 'financial_summary': return 'Financial Summary';
      case 'custom': return 'Custom';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'project_status': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'analysis': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      case 'financial_summary': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'custom': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <Loader message="Loading documentation..." />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Documentation</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Create and manage rich text documentation
          </p>
        </div>
        <button
          onClick={() => router.push('/documentation/new')}
          className="flex items-center space-x-2 px-4 py-2 glass-button rounded-lg text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>New Document</span>
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <div
            key={report.id}
            className="glass-medium glass-hover rounded-lg p-4 cursor-pointer group"
            onClick={() => router.push(`/documentation/${report.id}`)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg glass-light flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#FF6B4A]" />
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getTypeColor(report.type)}`}>
                {getTypeLabel(report.type)}
              </span>
            </div>

            <h3 className="text-sm font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">
              {report.title}
            </h3>

            {report.project && (
              <p className="text-xs text-text-tertiary mb-2">
                📁 {report.project.name}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-text-tertiary pt-3 border-t border-white/10">
              <div className="flex items-center space-x-1.5">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-[10px] font-semibold">
                  {report.user?.username?.substring(0, 2).toUpperCase() || 'U'}
                </div>
                <span className="text-[10px]">{report.user?.username || 'Unknown'}</span>
              </div>
              <span className="text-[10px]">{formatDate(report.updatedAt)}</span>
            </div>

            <div className="flex items-center space-x-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/documentation/${report.id}`);
                }}
                className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors text-xs"
              >
                <Edit className="w-3 h-3" />
                <span>Edit</span>
              </button>
              <button
                onClick={(e) => handleExportPDF(report, e)}
                className="flex-1 flex items-center justify-center space-x-1 px-2 py-1.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors text-xs"
              >
                <Download className="w-3 h-3" />
                <span>PDF</span>
              </button>
              <button
                onClick={(e) => handleDelete(report.id, e)}
                className="p-1.5 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {reports.length === 0 && (
        <div className="text-center py-8 glass-medium rounded-lg">
          <FileText className="w-10 h-10 text-text-tertiary mx-auto mb-2" />
          <p className="text-sm text-text-secondary mb-3">No documentation yet</p>
          <button
            onClick={() => router.push('/documentation/new')}
            className="px-3 py-1.5 text-sm glass-button rounded-lg"
          >
            Create Your First Document
          </button>
        </div>
      )}
    </div>
  );
}
