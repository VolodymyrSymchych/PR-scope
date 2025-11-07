import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface ProjectMetadata {
  project_name: string;
  project_type: string;
  industry: string;
  team_size: string;
  timeline: string;
}

export interface AnalyzeRequest extends ProjectMetadata {
  document: string;
  quick?: boolean;
}

export interface Project {
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
}

export interface Stats {
  projects_in_progress: number;
  total_projects: number;
  completion_rate: number;
  projects_completed: number;
}

export const api = {
  // Health check
  health: async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response.data;
  },

  // Get all projects
  getProjects: async (): Promise<{ projects: Project[]; total: number }> => {
    const response = await axios.get(`${API_BASE_URL}/projects`);
    return response.data;
  },

  // Get specific project
  getProject: async (id: number) => {
    const response = await axios.get(`${API_BASE_URL}/projects/${id}`);
    return response.data;
  },

  // Analyze project
  analyzeProject: async (data: AnalyzeRequest) => {
    const response = await axios.post(`${API_BASE_URL}/analyze`, data);
    return response.data;
  },

  // Upload document
  uploadDocument: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get stats
  getStats: async (): Promise<Stats> => {
    const response = await axios.get(`${API_BASE_URL}/stats`);
    return response.data;
  },

  // Get progress
  getProgress: async (projectId: number) => {
    const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/progress`);
    return response.data;
  },
};
