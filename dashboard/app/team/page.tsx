'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, Mail, MoreVertical, UserPlus, Clock, Calendar, ChevronDown, Building2 } from 'lucide-react';
import axios from 'axios';

interface Team {
  id: number;
  name: string;
  description?: string | null;
}

interface TeamMember {
  id: number;
  userId: number;
  role: string;
  user?: {
    id: number;
    username: string;
    fullName?: string | null;
    email: string;
  };
  attendance?: {
    totalHours: number;
    todayHours: number;
    weekHours: number;
  };
}

function TeamPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    const teamIdParam = searchParams.get('teamId');
    if (teamIdParam) {
      setSelectedTeamId(Number(teamIdParam));
    } else if (teams.length > 0) {
      setSelectedTeamId(teams[0].id);
    }
  }, [searchParams, teams]);

  useEffect(() => {
    if (selectedTeamId) {
      loadTeamMembers(selectedTeamId);
    }
  }, [selectedTeamId]);

  const loadTeams = async () => {
    try {
      const response = await axios.get('/api/teams');
      setTeams(response.data.teams || []);
      if (response.data.teams && response.data.teams.length > 0 && !searchParams.get('teamId')) {
        setSelectedTeamId(response.data.teams[0].id);
      }
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async (teamId: number) => {
    try {
      const response = await axios.get(`/api/teams/${teamId}/members`);
      const membersWithDetails = await Promise.all(
        (response.data.members || []).map(async (member: any) => {
          try {
            // Get user details
            const userRes = await axios.get(`/api/users/${member.userId}`);
            // Get attendance
            const attendanceRes = await axios.get(`/api/attendance?user_id=${member.userId}`);
            const entries = attendanceRes.data.entries || [];
            
            const totalHours = entries.reduce((sum: number, entry: any) => {
              return sum + (entry.duration || 0);
            }, 0) / 60; // Convert minutes to hours

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayHours = entries
              .filter((entry: any) => new Date(entry.clockIn) >= today)
              .reduce((sum: number, entry: any) => sum + (entry.duration || 0), 0) / 60;

            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weekHours = entries
              .filter((entry: any) => new Date(entry.clockIn) >= weekAgo)
              .reduce((sum: number, entry: any) => sum + (entry.duration || 0), 0) / 60;

            return {
              ...member,
              user: userRes.data.user,
              attendance: {
                totalHours: Math.round(totalHours * 10) / 10,
                todayHours: Math.round(todayHours * 10) / 10,
                weekHours: Math.round(weekHours * 10) / 10,
              },
            };
          } catch (error) {
            console.error(`Failed to load details for member ${member.userId}:`, error);
            return {
              ...member,
              user: null,
              attendance: null,
            };
          }
        })
      );
      setMembers(membersWithDetails.filter(m => m.user));
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  };

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Team</h1>
          <p className="text-text-secondary mt-1">
            Manage your team members and roles
          </p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 glass-button text-white rounded-lg">
          <UserPlus className="w-5 h-5" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Team Selection */}
      {teams.length > 0 && (
        <div className="glass-medium rounded-xl p-4 border border-white/10">
          <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Select Team
          </label>
          <select
            value={selectedTeamId || ''}
            onChange={(e) => {
              const teamId = Number(e.target.value);
              setSelectedTeamId(teamId);
              router.push(`/team?teamId=${teamId}`);
            }}
            className="w-full md:w-64 px-4 py-2 rounded-lg glass-light border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {teams.length === 0 ? (
        <div className="glass-medium rounded-2xl p-12 text-center">
          <Users className="w-16 h-16 text-text-tertiary mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">No Teams Yet</h3>
          <p className="text-text-secondary mb-6">Create your first team to get started</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-medium rounded-2xl p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl glass-light flex items-center justify-center shadow-[0_0_15px_rgba(128,152,249,0.4)]">
                  <Users className="w-6 h-6 text-[#8098F9]" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Total Members</p>
                  <p className="text-2xl font-bold text-text-primary">{members.length}</p>
                </div>
              </div>
            </div>

            <div className="glass-medium rounded-2xl p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl glass-light flex items-center justify-center shadow-[0_0_15px_rgba(0,214,107,0.4)]">
                  <Clock className="w-6 h-6 text-[#00D66B]" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Total Hours Today</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {members.reduce((sum, m) => sum + (m.attendance?.todayHours || 0), 0).toFixed(1)}h
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-medium rounded-2xl p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl glass-light flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                  <Calendar className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary">This Week</p>
                  <p className="text-2xl font-bold text-text-primary">
                    {members.reduce((sum, m) => sum + (m.attendance?.weekHours || 0), 0).toFixed(1)}h
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Team Members Grid */}
          {members.length === 0 ? (
            <div className="glass-medium rounded-2xl p-12 text-center">
              <Users className="w-16 h-16 text-text-tertiary mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">No Members</h3>
              <p className="text-text-secondary">This team doesn't have any members yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => {
                const user = member.user;
                if (!user) return null;

                const initials = user.fullName
                  ? user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                  : user.username.slice(0, 2).toUpperCase();

                return (
                  <div key={member.id} className="glass-medium glass-hover rounded-2xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-full bg-[#8098F9] flex items-center justify-center text-white font-semibold text-lg shadow-[0_0_20px_rgba(128,152,249,0.5)]">
                            {initials}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-text-primary">
                            {user.fullName || user.username}
                          </h3>
                          <p className="text-sm text-text-secondary">{member.role}</p>
                        </div>
                      </div>
                      <button className="p-1 glass-subtle hover:glass-light rounded transition-all">
                        <MoreVertical className="w-5 h-5 text-text-tertiary" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-text-secondary mb-4">
                      <Mail className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                    
                    {/* Attendance Stats */}
                    {member.attendance && (
                      <div className="mb-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-tertiary">Today:</span>
                          <span className="text-text-primary font-medium">{member.attendance.todayHours}h</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-tertiary">This Week:</span>
                          <span className="text-text-primary font-medium">{member.attendance.weekHours}h</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-tertiary">Total:</span>
                          <span className="text-text-primary font-medium">{member.attendance.totalHours}h</span>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => router.push(`/profile/${user.id}`)}
                      className="w-full py-2 glass-light rounded-lg text-sm font-medium text-text-primary hover:glass-medium transition-all"
                    >
                      View Profile
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function TeamPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <TeamPageContent />
    </Suspense>
  );
}
