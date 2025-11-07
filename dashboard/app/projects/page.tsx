'use client';

import { useEffect, useState } from 'react';
import { Plus, Filter, Search } from 'lucide-react';
import { ProjectCard } from '../../components/ProjectCard';
import { api, Project } from '../../lib/api';
import { useRouter } from 'next/navigation';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">
            All Projects
          </h1>
          <p className="text-text-secondary mt-1">
            Manage and analyze your project scope documents
          </p>
        </div>
        <button
          onClick={() => router.push('/projects/new')}
          className="glass-button flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>New Analysis</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg glass-medium border border-white/10 focus:outline-none focus:border-primary/50 text-text-primary placeholder:text-text-tertiary transition-all"
          />
        </div>
        <button className="glass-light flex items-center space-x-2 px-4 py-3 rounded-lg hover:glass-medium transition-all duration-300 hover:scale-105">
          <Filter className="w-5 h-5 text-text-secondary" />
          <span className="text-text-primary">Filters</span>
        </button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary glow-cyan-soft"></div>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              {...project}
              team={['JD', 'SK', 'MR']}
              onClick={() => router.push(`/projects/${project.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 glass-medium rounded-2xl border border-white/10">
          <p className="text-text-secondary">
            {searchQuery ? 'No projects match your search.' : 'No projects yet.'}
          </p>
        </div>
      )}
    </div>
  );
}
