'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, Loader2, Users, DollarSign, Calendar, UserPlus, Building2 } from 'lucide-react';
import axios from 'axios';

interface Team {
  id: number;
  name: string;
  description?: string | null;
}

interface Friend {
  id: number;
  senderId: number;
  receiverId: number;
  status: string;
  friend?: {
    id: number;
    username: string;
    fullName?: string | null;
    email: string;
  } | null;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    type: 'software development',
    industry: 'technology',
    teamSize: '',
    timeline: '',
    budget: '',
    startDate: '',
    endDate: '',
    document: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadUser();
    loadTeamsAndFriends();
  }, []);

  const loadUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      if (response.data.user) {
        setCurrentUserId(response.data.user.id);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const loadTeamsAndFriends = async () => {
    try {
      const [teamsRes, friendsRes] = await Promise.all([
        axios.get('/api/teams'),
        axios.get('/api/friends'),
      ]);
      setTeams(teamsRes.data.teams || []);
      setFriends(friendsRes.data.friends || []);
    } catch (error) {
      console.error('Failed to load teams and friends:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await axios.post('/api/upload', formData);
      setFormData(prev => ({ ...prev, document: result.data.content }));
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file. Please try again.');
    }
  };

  const toggleFriendSelection = (friendId: number) => {
    setSelectedFriendIds(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const projectData = {
        name: formData.name,
        type: formData.type,
        industry: formData.industry,
        teamSize: formData.teamSize || null,
        timeline: formData.timeline || null,
        budget: formData.budget ? parseInt(formData.budget) : null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        status: 'in_progress',
      };

      const response = await axios.post('/api/projects', projectData);
      
      // If document provided, analyze it
      if (formData.document) {
        try {
          await axios.post('/api/analyze', {
            project_name: formData.name,
            project_type: formData.type,
            industry: formData.industry,
            team_size: formData.teamSize,
            timeline: formData.timeline,
            document: formData.document,
          });
        } catch (error) {
          console.error('Analysis failed:', error);
        }
      }

      router.push(`/projects/${response.data.project.id}`);
    } catch (error: any) {
      console.error('Project creation failed:', error);
      alert(error.response?.data?.error || 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text">Create New Project</h1>
        <p className="text-text-secondary mt-1">
          Set up a new project with team assignment and budget tracking
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Information */}
        <div className="glass-medium rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Project Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Project Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg glass-medium border border-white/10 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Customer Portal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Project Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 rounded-lg glass-medium border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option>software development</option>
                <option>web application</option>
                <option>mobile application</option>
                <option>infrastructure</option>
                <option>data analytics</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Industry
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-4 py-3 rounded-lg glass-medium border border-white/10 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., financial services"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Team Size
              </label>
              <input
                type="text"
                value={formData.teamSize}
                onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                className="w-full px-4 py-3 rounded-lg glass-medium border border-white/10 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 5 developers"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Budget ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-4 py-3 pl-10 rounded-lg glass-medium border border-white/10 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Timeline
              </label>
              <input
                type="text"
                value={formData.timeline}
                onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                className="w-full px-4 py-3 rounded-lg glass-medium border border-white/10 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 12 weeks"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 pl-10 rounded-lg glass-medium border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 pl-10 rounded-lg glass-medium border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Team & People Assignment */}
        <div className="glass-medium rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team & People Assignment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team Selection */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <Building2 className="w-4 h-4 inline mr-2" />
                Assign Team
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg glass-medium border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">No Team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              {teams.length === 0 && (
                <p className="text-xs text-text-tertiary mt-2">No teams available. Create one in Teams page.</p>
              )}
            </div>

            {/* Friends Selection */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <UserPlus className="w-4 h-4 inline mr-2" />
                Assign Friends
              </label>
              {friends.length === 0 ? (
                <div className="glass-subtle rounded-lg p-4 text-center">
                  <p className="text-sm text-text-tertiary">No friends yet. Add friends to assign them to projects.</p>
                </div>
              ) : (
                <div className="max-h-32 overflow-y-auto space-y-2 glass-subtle rounded-lg p-3">
                  {friends.map((friendship) => {
                    const friend = friendship.friend || { 
                      id: friendship.senderId === currentUserId 
                        ? friendship.receiverId 
                        : friendship.senderId,
                      username: '',
                      fullName: null,
                      email: ''
                    };
                    return (
                      <label
                        key={friendship.id}
                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFriendIds.includes(friend.id)}
                          onChange={() => toggleFriendSelection(friend.id)}
                          className="rounded border-white/20"
                        />
                        <span className="text-sm text-text-primary">
                          {(friend as any).fullName || (friend as any).username || `Friend #${friend.id}`}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Document Upload */}
        <div className="glass-medium rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Project Document (Optional)
          </h3>

          {!formData.document ? (
            <div className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center glass-subtle">
              <Upload className="w-12 h-12 text-text-tertiary mx-auto mb-4 opacity-50" />
              <p className="text-text-secondary mb-2">
                Upload your project scope document
              </p>
              <p className="text-sm text-text-tertiary mb-4">
                Supports .md, .txt files
              </p>
              <label className="inline-flex items-center px-4 py-2 glass-button text-white rounded-lg cursor-pointer">
                <FileText className="w-4 h-4 mr-2" />
                Choose File
                <input
                  type="file"
                  accept=".md,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="glass-subtle border border-green-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="font-medium text-text-primary">
                      {selectedFile?.name || 'Document uploaded'}
                    </p>
                    <p className="text-sm text-text-tertiary">
                      {formData.document.length} characters
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, document: '' });
                    setSelectedFile(null);
                  }}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Or paste document */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-text-primary mb-2">
              Or paste document content
            </label>
            <textarea
              value={formData.document}
              onChange={(e) => setFormData({ ...formData, document: e.target.value })}
              rows={8}
              className="w-full px-4 py-3 rounded-lg glass-medium border border-white/10 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              placeholder="Paste your project scope document here..."
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 glass-light hover:glass-medium rounded-lg text-text-primary transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.name}
            className="flex items-center space-x-2 px-6 py-3 glass-button text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <span>Create Project</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
