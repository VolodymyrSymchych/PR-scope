import { Mail, MessageCircle, MoreVertical, UserMinus } from 'lucide-react';
import { useState } from 'react';

interface Friend {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

interface FriendsListProps {
  friends: Friend[];
  onRefresh: () => void;
}

export function FriendsList({ friends, onRefresh }: FriendsListProps) {
  const [showMenu, setShowMenu] = useState<number | null>(null);

  const handleRemoveFriend = async (friendId: number) => {
    if (!confirm('Are you sure you want to remove this friend?')) {
      return;
    }

    try {
      const response = await fetch(`/api/friends/${friendId}/remove`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  if (friends.length === 0) {
    return (
      <div className="glass-strong rounded-2xl p-12 text-center border border-border">
        <Mail className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-text-primary mb-2">No Friends Yet</h3>
        <p className="text-text-secondary">
          Start by adding friends to collaborate on projects
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {friends.map((friend) => (
        <div
          key={friend.id}
          className="glass-light glass-hover rounded-xl p-6 border border-border transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                {friend.fullName?.charAt(0) || friend.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-semibold text-text-primary">{friend.fullName || friend.username}</h4>
                <p className="text-sm text-text-tertiary">@{friend.username}</p>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowMenu(showMenu === friend.id ? null : friend.id)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-text-tertiary" />
              </button>

              {showMenu === friend.id && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(null)}
                  />
                  <div className="absolute right-0 mt-2 w-48 glass-strong rounded-xl border border-border shadow-xl z-20 overflow-hidden">
                    <button
                      onClick={() => {
                        alert('Message feature coming soon');
                        setShowMenu(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
                    >
                      <MessageCircle className="w-4 h-4 text-primary" />
                      <span className="text-text-primary">Send Message</span>
                    </button>
                    <button
                      onClick={() => {
                        handleRemoveFriend(friend.id);
                        setShowMenu(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-danger/10 transition-colors text-left text-danger"
                    >
                      <UserMinus className="w-4 h-4" />
                      <span>Remove Friend</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Mail className="w-4 h-4" />
            <span className="truncate">{friend.email}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

