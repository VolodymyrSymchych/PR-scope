'use client';

import { useEffect, useState } from 'react';
import { Plus, Filter, Search, X } from 'lucide-react';
import { ProjectCard } from '../../components/ProjectCard';
import { api, Project } from '../../lib/api';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Loader } from '@/components/Loader';
import axios from 'axios';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';

type FilterType = 'all' | 'status' | 'risk_level' | 'type' | 'industry';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterValue, setFilterValue] = useState<string>('all');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; project: Project | null }>({
    isOpen: false,
    project: null,
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data.projects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setDeleteModal({ isOpen: true, project });
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.project) return;

    try {
      await axios.delete(`/api/projects/${deleteModal.project.id}`);
      setDeleteModal({ isOpen: false, project: null });
      loadProjects();
    } catch (error: any) {
      console.error('Failed to delete project:', error);
      alert(error.response?.data?.error || 'Failed to delete project. Please try again.');
    }
  };

  // Get unique values for filter options
  const statuses = Array.from(new Set(projects.map(p => p.status).filter(Boolean)));
  const riskLevels = Array.from(new Set(projects.map(p => p.risk_level).filter(Boolean)));
  const types = Array.from(new Set(projects.map(p => p.type).filter(Boolean)));
  const industries = Array.from(new Set(projects.map(p => p.industry).filter(Boolean)));

  const filteredProjects = projects.filter(project => {
    // Search filter
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Type filter
    let matchesFilter = true;
    if (filterType === 'all' || filterValue === 'all') {
      matchesFilter = true;
    } else if (filterType === 'status') {
      matchesFilter = project.status === filterValue;
    } else if (filterType === 'risk_level') {
      matchesFilter = project.risk_level === filterValue;
    } else if (filterType === 'type') {
      matchesFilter = project.type === filterValue;
    } else if (filterType === 'industry') {
      matchesFilter = project.industry === filterValue;
    }

    return matchesSearch && matchesFilter;
  });

  const clearFilters = () => {
    setFilterType('all');
    setFilterValue('all');
  };

  const hasActiveFilter = filterType !== 'all' && filterValue !== 'all';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">
            All Projects
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage and analyze your project scope documents
          </p>
        </div>
        <button
          onClick={() => router.push('/projects/new')}
          className="glass-button flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>New Analysis</span>
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg glass-medium border border-white/10 focus:outline-none focus:border-primary/50 text-text-primary placeholder:text-text-tertiary transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "glass-light flex items-center space-x-2 px-3 py-2 rounded-lg hover:glass-medium transition-all duration-200 hover:scale-105",
              showFilters && "glass-medium border border-primary/50",
              hasActiveFilter && "border-primary/50"
            )}
          >
            <Filter className="w-4 h-4 text-text-secondary" />
            <span className="text-sm text-text-primary">Filters</span>
            {hasActiveFilter && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="glass-medium rounded-lg p-3 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-text-primary">Filter Projects</h3>
              {hasActiveFilter && (
                <button
                  onClick={clearFilters}
                  className="text-[10px] text-text-tertiary hover:text-text-primary flex items-center space-x-1"
                >
                  <X className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Filter Type Selector */}
              <div>
                <label className="block text-[10px] font-medium text-text-tertiary mb-1.5">
                  Filter By
                </label>
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value as FilterType);
                    setFilterValue('all');
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg glass-input border border-white/10 text-text-primary text-xs focus:outline-none focus:border-primary/50"
                >
                  <option value="all">All Projects</option>
                  <option value="status">Status</option>
                  <option value="risk_level">Risk Level</option>
                  <option value="type">Type</option>
                  <option value="industry">Industry</option>
                </select>
              </div>

              {/* Filter Value Selector */}
              {filterType !== 'all' && (
                <div>
                  <label className="block text-[10px] font-medium text-text-tertiary mb-1.5">
                    {filterType === 'status' && 'Status'}
                    {filterType === 'risk_level' && 'Risk Level'}
                    {filterType === 'type' && 'Type'}
                    {filterType === 'industry' && 'Industry'}
                  </label>
                  <select
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg glass-input border border-white/10 text-text-primary text-xs focus:outline-none focus:border-primary/50"
                  >
                    <option value="all">All</option>
                    {filterType === 'status' && statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                    {filterType === 'risk_level' && riskLevels.map(risk => (
                      <option key={risk} value={risk}>{risk}</option>
                    ))}
                    {filterType === 'type' && types.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                    {filterType === 'industry' && industries.map(industry => (
                      <option key={industry} value={industry}>{industry}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            {hasActiveFilter && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-[10px] text-text-tertiary">
                  Showing {filteredProjects.length} of {projects.length} projects
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Projects Grid */}
      {loading ? (
        <Loader message="Loading your projects..." />
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              {...project}
              team={['JD', 'SK', 'MR']}
              onClick={() => router.push(`/projects/${project.id}`)}
              onDelete={(e) => deleteProject(project.id, e)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 glass-medium rounded-xl border border-white/10">
          <p className="text-sm text-text-secondary">
            {searchQuery || hasActiveFilter
              ? 'No projects match your filters.'
              : 'No projects yet.'}
          </p>
          {(searchQuery || hasActiveFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                clearFilters();
              }}
              className="mt-3 px-3 py-1.5 text-xs glass-light hover:glass-medium rounded-lg transition-all"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Project"
        message="This will mark the project as deleted. This action can be undone by restoring the project from the deleted projects list."
        itemName={deleteModal.project?.name || ''}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, project: null })}
      />
    </div>
  );
}
