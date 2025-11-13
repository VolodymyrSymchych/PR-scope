'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Download } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { RichTextEditor } from '@/components/RichTextEditor';
import axios from 'axios';
import { generateReportPDF } from '@/lib/report-pdf';
import { Loader } from '@/components/Loader';

interface Project {
  id: number;
  name: string;
}

export default function DocumentationEditorPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('<h1>New Report</h1><p>Start writing your report here...</p>');
  const [reportType, setReportType] = useState<'project_status' | 'analysis' | 'financial_summary' | 'custom'>('custom');
  const [projectId, setProjectId] = useState<string>('');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!isNew);

  useEffect(() => {
    loadProjects();
    if (!isNew) {
      loadReport();
    }
  }, [params.id]);

  const loadProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadReport = async () => {
    try {
      setLoadingData(true);
      const response = await axios.get(`/api/reports/${params.id}`);
      const report = response.data.report;
      setTitle(report.title || '');
      setContent(report.content || '<h1>New Report</h1><p>Start writing your report here...</p>');
      setReportType(report.type || 'custom');
      setProjectId(report.projectId?.toString() || '');
      setStatus(report.status || 'draft');
    } catch (error) {
      console.error('Failed to load report:', error);
      alert('Failed to load report. Please try again.');
      router.push('/documentation');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title for the report');
      return;
    }

    setLoading(true);
    try {
      const reportData = {
        title,
        content,
        type: reportType,
        project_id: projectId ? parseInt(projectId) : null,
        status,
      };

      if (isNew) {
        await axios.post('/api/reports', reportData);
      } else {
        await axios.put(`/api/reports/${params.id}`, reportData);
      }
      
      router.push('/documentation');
    } catch (error: any) {
      console.error('Failed to save report:', error);
      alert(`Failed to save report: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    try {
      const reportData = {
        id: isNew ? 0 : parseInt(params.id as string),
        title,
        content,
        type: reportType,
        status,
        projectId: projectId ? parseInt(projectId) : null,
        userId: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        project: projectId ? projects.find(p => p.id === parseInt(projectId)) : undefined,
      };
      await generateReportPDF(reportData as any);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  if (loadingData) {
    return <Loader message="Loading document editor..." />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/documentation')}
          className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Documentation</span>
        </button>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportToPDF}
            className="flex items-center space-x-2 px-4 py-2 glass-light hover:glass-medium rounded-lg transition-all"
          >
            <Download className="w-5 h-5 text-text-secondary" />
            <span className="text-text-primary">Export PDF</span>
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 glass-button text-white rounded-lg disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{loading ? 'Saving...' : 'Save Report'}</span>
          </button>
        </div>
      </div>

      {/* Report Details */}
      <div className="glass-medium rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Report Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter report title..."
            className="w-full px-4 py-3 rounded-lg glass-input text-text-primary text-xl font-semibold"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-4 py-3 rounded-lg glass-input text-text-primary"
            >
              <option value="project_status">Project Status</option>
              <option value="analysis">Analysis Report</option>
              <option value="financial_summary">Financial Summary</option>
              <option value="custom">Custom Report</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Related Project (Optional)
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-4 py-3 rounded-lg glass-input text-text-primary"
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
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-3 rounded-lg glass-input text-text-primary"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rich Text Editor */}
      <div className="glass-medium rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Report Content</h3>
        <RichTextEditor content={content} onChange={setContent} />
      </div>

      {/* Additional Actions */}
      <div className="flex justify-end space-x-3 pb-8">
        <button
          onClick={() => router.push('/documentation')}
          className="px-6 py-3 text-text-secondary hover:text-text-primary transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-3 glass-button text-white rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Report'}
        </button>
      </div>
    </div>
  );
}
