'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Calendar, Award, Users, FolderOpen } from 'lucide-react';

interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: string;
  createdAt: string;
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching user profile
    setTimeout(() => {
      setProfile({
        id: Number(params.id),
        username: 'vovaexim',
        fullName: 'Symchych Volodymyr',
        email: 'vovaexim@gmail.com',
        role: 'Developer',
        createdAt: '2024-01-15',
      });
      setLoading(false);
    }, 500);
  }, [params.id]);

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
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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
                {profile.fullName}
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

              <div className="flex gap-3 mt-6">
                <button className="glass-button px-6 py-2 rounded-lg font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Add Friend
                </button>
                <button className="glass-light px-6 py-2 rounded-lg font-semibold hover:glass-medium transition-all flex items-center gap-2 text-text-primary">
                  <Mail className="w-4 h-4" />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-medium rounded-2xl p-6 border border-white/10 hover:glass-light transition-all">
            <div className="flex items-center gap-3 mb-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              <span className="text-text-secondary">Projects</span>
            </div>
            <div className="text-3xl font-bold gradient-text">12</div>
          </div>

          <div className="glass-medium rounded-2xl p-6 border border-white/10 hover:glass-light transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-text-secondary">Friends</span>
            </div>
            <div className="text-3xl font-bold gradient-text">48</div>
          </div>

          <div className="glass-medium rounded-2xl p-6 border border-white/10 hover:glass-light transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-5 h-5 text-primary" />
              <span className="text-text-secondary">Analyses</span>
            </div>
            <div className="text-3xl font-bold gradient-text">156</div>
          </div>
        </div>

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

