'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Users, Clock, Search } from 'lucide-react';
import { FriendsList } from '@/components/friends/FriendsList';
import { FriendRequestCard } from '@/components/friends/FriendRequestCard';
import { AddFriendModal } from '@/components/friends/AddFriendModal';

type Tab = 'friends' | 'requests' | 'find';

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await fetch('/api/friends');
      if (response.ok) {
        const data = await response.json();
        setFriends(data.friends || []);
        setPendingRequests(data.pendingRequests || []);
      }
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (friendshipId: number) => {
    try {
      const response = await fetch(`/api/friends/${friendshipId}/accept`, {
        method: 'POST',
      });
      
      if (response.ok) {
        fetchFriends();
      }
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const handleRejectRequest = async (friendshipId: number) => {
    try {
      const response = await fetch(`/api/friends/${friendshipId}/reject`, {
        method: 'POST',
      });
      
      if (response.ok) {
        fetchFriends();
      }
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Friends</h1>
            <p className="text-text-secondary">Manage your connections and friend requests</p>
          </div>
          <button
            onClick={() => setShowAddFriendModal(true)}
            className="glass-button px-6 py-3 rounded-xl font-semibold text-white hover:scale-105 transition-all flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Add Friend
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-6 py-3 font-semibold transition-all relative ${
              activeTab === 'friends'
                ? 'text-primary'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>Friends</span>
              {friends.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-sm">
                  {friends.length}
                </span>
              )}
            </div>
            {activeTab === 'friends' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3 font-semibold transition-all relative ${
              activeTab === 'requests'
                ? 'text-primary'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>Pending Requests</span>
              {pendingRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-warning/20 text-warning text-sm">
                  {pendingRequests.length}
                </span>
              )}
            </div>
            {activeTab === 'requests' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('find')}
            className={`px-6 py-3 font-semibold transition-all relative ${
              activeTab === 'find'
                ? 'text-primary'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              <span>Find Friends</span>
            </div>
            {activeTab === 'find' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {activeTab === 'friends' && (
              <FriendsList friends={friends} onRefresh={fetchFriends} />
            )}

            {activeTab === 'requests' && (
              <div className="space-y-4">
                {pendingRequests.length === 0 ? (
                  <div className="glass-strong rounded-2xl p-12 text-center border border-border">
                    <Clock className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-text-primary mb-2">
                      No Pending Requests
                    </h3>
                    <p className="text-text-secondary">
                      You don't have any friend requests at the moment
                    </p>
                  </div>
                ) : (
                  pendingRequests.map((request: any) => (
                    <FriendRequestCard
                      key={request.id}
                      request={request}
                      onAccept={handleAcceptRequest}
                      onReject={handleRejectRequest}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'find' && (
              <div className="glass-strong rounded-2xl p-8 border border-border">
                <h3 className="text-xl font-semibold text-text-primary mb-6">Find Friends</h3>
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                  <input
                    type="text"
                    placeholder="Search by username or email..."
                    className="glass-input w-full pl-12 pr-4 py-3 rounded-xl text-text-primary placeholder:text-text-tertiary"
                  />
                </div>
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                  <p className="text-text-secondary">
                    Search for friends by their username or email address
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Friend Modal */}
      {showAddFriendModal && (
        <AddFriendModal
          onClose={() => setShowAddFriendModal(false)}
          onSuccess={() => {
            setShowAddFriendModal(false);
            fetchFriends();
          }}
        />
      )}
    </div>
  );
}

