'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Calendar, Award, Users, FolderOpen, Clock, TrendingUp } from 'lucide-react';
import axios from 'axios';

interface UserProfile {
  id: number;
  username: string;
  fullName?: string | null;
  email: string;
  avatarUrl?: string;
  role: string;
  createdAt: string;
}

interface AttendanceStats {
  totalHours: number;
  todayHours: number;
  weekHours: number;
  monthHours: number;
  entries: any[];
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [attendance, setAttendance] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [params.id]);

  const loadProfile = async () => {
    try {
      const userId = Number(params.id);
      
      // Load user profile
      const userRes = await axios.get(`/api/users/${userId}`);
      if (userRes.data.user) {
        setProfile(userRes.data.user);
      }

      // Load attendance
      const attendanceRes = await axios.get(`/api/attendance?user_id=${userId}`);
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

      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const monthHours = entries
        .filter((entry: any) => new Date(entry.clockIn) >= monthAgo)
        .reduce((sum: number, entry: any) => sum + (entry.duration || 0), 0) / 60;

      setAttendance({
        totalHours: Math.round(totalHours * 10) / 10,
        todayHours: Math.round(todayHours * 10) / 10,
        weekHours: Math.round(weekHours * 10) / 10,
        monthHours: Math.round(monthHours * 10) / 10,
        entries,
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary glow-cyan-soft"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-medium rounded-2xl p-12 border border-white/10 text-center">
          <p className="text-text-secondary">User not found</p>
        </div>
      </div>
    );
  }

  const initials = profile.fullName
    ? profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile.username.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 glass-light rounded-lg hover:glass-medium transition-all hover:scale-110"
          >
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="glass-medium rounded-3xl p-8 border border-white/10">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#8098F9] to-[#A78BFA] flex items-center justify-center text-white text-3xl font-bold shadow-[0_0_40px_rgba(128,152,249,0.6)]">
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold gradient-text mb-2">
                {profile.fullName || profile.username}
              </h1>
              <p className="text-text-secondary text-lg mb-4">@{profile.username}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-text-secondary">
                  <Mail className="w-5 h-5" />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center gap-3 text-text-secondary">
                  <Award className="w-5 h-5" />
                  <span>{profile.role}</span>
                </div>
                <div className="flex items-center gap-3 text-text-secondary">
                  <Calendar className="w-5 h-5" />
                  <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-medium rounded-2xl p-6 border border-white/10 hover:glass-light transition-all">
            <div className="flex items-center gap-3 mb-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              <span className="text-text-secondary">Projects</span>
            </div>
            <div className="text-3xl font-bold gradient-text">-</div>
          </div>

          <div className="glass-medium rounded-2xl p-6 border border-white/10 hover:glass-light transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-text-secondary">Friends</span>
            </div>
            <div className="text-3xl font-bold gradient-text">-</div>
          </div>

          {/* Attendance Stats */}
          {attendance && (
            <>
              <div className="glass-medium rounded-2xl p-6 border border-white/10 hover:glass-light transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-[#00D66B]" />
                  <span className="text-text-secondary">Today</span>
                </div>
                <div className="text-3xl font-bold gradient-text">{attendance.todayHours}h</div>
              </div>

              <div className="glass-medium rounded-2xl p-6 border border-white/10 hover:glass-light transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <span className="text-text-secondary">This Week</span>
                </div>
                <div className="text-3xl font-bold gradient-text">{attendance.weekHours}h</div>
              </div>
            </>
          )}
        </div>

        {/* Attendance Details */}
        {attendance && (
          <div className="glass-medium rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Attendance & Time Tracking
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="glass-subtle rounded-xl p-4">
                <div className="text-sm text-text-tertiary mb-1">Total Hours</div>
                <div className="text-2xl font-bold text-text-primary">{attendance.totalHours}h</div>
              </div>
              <div className="glass-subtle rounded-xl p-4">
                <div className="text-sm text-text-tertiary mb-1">This Month</div>
                <div className="text-2xl font-bold text-text-primary">{attendance.monthHours}h</div>
              </div>
              <div className="glass-subtle rounded-xl p-4">
                <div className="text-sm text-text-tertiary mb-1">Total Entries</div>
                <div className="text-2xl font-bold text-text-primary">{attendance.entries.length}</div>
              </div>
            </div>

            {/* Recent Entries */}
            {attendance.entries.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-text-primary mb-2">Recent Time Entries</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {attendance.entries.slice(0, 10).map((entry: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 glass-subtle rounded-lg hover:glass-light transition-all"
                    >
                      <div>
                      <div className="text-sm text-text-primary">
                        {new Date(entry.clockIn).toLocaleDateString()} {new Date(entry.clockIn).toLocaleTimeString()}
                      </div>
                      {entry.clockOut && (
                        <div className="text-xs text-text-tertiary">
                          Out: {new Date(entry.clockOut).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-medium text-text-primary">
                      {entry.duration ? `${Math.round(entry.duration / 60 * 10) / 10}h` : 'In progress'}
                    </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Activity */}
        <div className="glass-medium rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-text-primary mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { action: 'Created project', name: 'Mobile App Redesign', time: '2 hours ago' },
              { action: 'Completed analysis', name: 'E-commerce Platform', time: '1 day ago' },
              { action: 'Added friend', name: 'Jane Smith', time: '3 days ago' },
            ].map((activity, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 glass-light rounded-xl hover:glass-medium transition-all"
              >
                <div>
                  <div className="text-text-primary font-medium">{activity.action}</div>
                  <div className="text-sm text-text-secondary">{activity.name}</div>
                </div>
                <div className="text-sm text-text-tertiary">{activity.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
