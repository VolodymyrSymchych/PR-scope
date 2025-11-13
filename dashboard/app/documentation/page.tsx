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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Documentation</h1>
          <p className="text-text-secondary mt-1">
            Create and manage rich text documentation
          </p>
        </div>
        <button
          onClick={() => router.push('/documentation/new')}
          className="flex items-center space-x-2 px-4 py-2 glass-button text-white rounded-lg"
        >
          <Plus className="w-5 h-5" />
          <span>New Document</span>
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div
            key={report.id}
            className="glass-medium glass-hover rounded-2xl p-6 cursor-pointer group"
            onClick={() => router.push(`/documentation/${report.id}`)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl glass-light flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#FF6B4A] drop-" />
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(report.type)}`}>
                {getTypeLabel(report.type)}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-primary transition-colors">
              {report.title}
            </h3>

            {report.project && (
              <p className="text-sm text-text-tertiary mb-3">
                📁 {report.project.name}
              </p>
            )}

            <div className="flex items-center justify-between text-sm text-text-tertiary pt-4 border-t border-white/10">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-semibold">
                  {report.user?.username?.substring(0, 2).toUpperCase() || 'U'}
                </div>
                <span>{report.user?.username || 'Unknown'}</span>
              </div>
              <span>{formatDate(report.updatedAt)}</span>
            </div>

            <div className="flex items-center space-x-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/documentation/${report.id}`);
                }}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors text-sm"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={(e) => handleExportPDF(report, e)}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                <span>PDF</span>
              </button>
              <button
                onClick={(e) => handleDelete(report.id, e)}
                className="p-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {reports.length === 0 && (
        <div className="text-center py-12 glass-medium rounded-2xl">
          <FileText className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-secondary mb-4">No documentation yet</p>
          <button
            onClick={() => router.push('/documentation/new')}
            className="px-4 py-2 glass-button text-white rounded-lg"
          >
            Create Your First Document
          </button>
        </div>
      )}
    </div>
  );
}
