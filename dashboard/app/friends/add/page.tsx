'use client';

import { useState } from 'react';
import { UserPlus, Search, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AddFriendsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    // Simulate API call
    setTimeout(() => {
      setResults([
        { id: 1, username: 'john_doe', fullName: 'John Doe', email: 'john@example.com' },
        { id: 2, username: 'jane_smith', fullName: 'Jane Smith', email: 'jane@example.com' },
      ]);
      setSearching(false);
    }, 1000);
  };

  const sendFriendRequest = async (userId: number) => {
    try {
      const response = await fetch('/api/friends/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: userId }),
      });

      if (response.ok) {
        alert('Friend request sent!');
      }
    } catch (error) {
      console.error('Failed to send friend request:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/friends')}
            className="p-2 glass-light rounded-lg hover:glass-medium transition-all hover:scale-110"
          >
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </button>
          <div>
            <h1 className="text-3xl font-bold gradient-text">Add Friends</h1>
            <p className="text-text-secondary mt-1">
              Search for users to connect with
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="glass-medium rounded-2xl p-6 border border-white/10">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search by username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 rounded-lg glass-input border border-white/10 focus:outline-none focus:border-primary/50 text-text-primary placeholder:text-text-tertiary transition-all"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="glass-button px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {results.map((user) => (
            <div
              key={user.id}
              className="glass-medium rounded-2xl p-6 border border-white/10 flex items-center justify-between hover:glass-light transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#8098F9] flex items-center justify-center text-white font-semibold shadow-[0_0_20px_rgba(128,152,249,0.5)]">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-text-primary">{user.fullName}</div>
                  <div className="text-sm text-text-secondary">@{user.username}</div>
                  <div className="text-xs text-text-tertiary">{user.email}</div>
                </div>
              </div>
              <button
                onClick={() => sendFriendRequest(user.id)}
                className="glass-button flex items-center gap-2 px-4 py-2 rounded-lg font-semibold"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Friend</span>
              </button>
            </div>
          ))}

          {results.length === 0 && !searching && searchQuery && (
            <div className="glass-medium rounded-2xl p-12 border border-white/10 text-center">
              <p className="text-text-secondary">No users found matching "{searchQuery}"</p>
            </div>
          )}

          {results.length === 0 && !searching && !searchQuery && (
            <div className="glass-medium rounded-2xl p-12 border border-white/10 text-center">
              <UserPlus className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary">Search for friends to start connecting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

