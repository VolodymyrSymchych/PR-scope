'use client';

import { Search, ChevronDown, Plus } from 'lucide-react';
import { NotificationBell } from './notifications/NotificationBell';
import { useEffect, useState, memo, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

interface User {
  id: number;
  email: string;
  username: string;
  fullName?: string | null;
  avatarUrl?: string | null;
}

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
}

export const Header = memo(function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [showTeamsDropdown, setShowTeamsDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [mounted, setMounted] = useState(false);
  const teamsButtonRef = useRef<HTMLButtonElement>(null);
  const teamsDropdownRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const [teamsDropdownPosition, setTeamsDropdownPosition] = useState({ top: 0, left: 0 });
  const [userDropdownPosition, setUserDropdownPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Fetch user from session
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(err => console.error('Failed to fetch user:', err));

    // Fetch user's teams
    fetch('/api/teams')
      .then(res => res.json())
      .then(data => {
        if (data.teams) {
          setTeams(data.teams);
        }
      })
      .catch(err => console.error('Failed to fetch teams:', err));

    // Fetch user's friends
    fetch('/api/friends')
      .then(res => res.json())
      .then(data => {
        if (data.friends) {
          setFriends(data.friends);
        }
      })
      .catch(err => console.error('Failed to fetch friends:', err));
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setCreatingTeam(true);
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teamName,
          description: teamDescription || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTeams([...teams, data.team]);
        setShowCreateTeamModal(false);
        setTeamName('');
        setTeamDescription('');
        toast.success('Team created successfully');
        router.push(`/team?teamId=${data.team.id}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create team');
      }
    } catch (error) {
      console.error('Failed to create team:', error);
      toast.error('Failed to create team');
    } finally {
      setCreatingTeam(false);
    }
  };

  // Update dropdown positions when shown
  useEffect(() => {
    if (showTeamsDropdown && teamsButtonRef.current) {
      const rect = teamsButtonRef.current.getBoundingClientRect();
      setTeamsDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left
      });
    }
  }, [showTeamsDropdown]);

  useEffect(() => {
    if (showUserDropdown && userButtonRef.current) {
      const rect = userButtonRef.current.getBoundingClientRect();
      setUserDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [showUserDropdown]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        teamsButtonRef.current &&
        teamsDropdownRef.current &&
        !teamsButtonRef.current.contains(event.target as Node) &&
        !teamsDropdownRef.current.contains(event.target as Node)
      ) {
        setShowTeamsDropdown(false);
      }
      if (
        userButtonRef.current &&
        userDropdownRef.current &&
        !userButtonRef.current.contains(event.target as Node) &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserDropdown(false);
      }
    };

    if (showTeamsDropdown || showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTeamsDropdown, showUserDropdown]);

  // Close dropdowns and modals on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowTeamsDropdown(false);
        setShowUserDropdown(false);
        setShowCreateTeamModal(false);
      }
    };

    if (showTeamsDropdown || showUserDropdown || showCreateTeamModal) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showTeamsDropdown, showUserDropdown, showCreateTeamModal]);

  const initials = useMemo(() => {
    return user?.fullName
      ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : user?.username?.slice(0, 2).toUpperCase() || 'U';
  }, [user?.fullName, user?.username]);

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/sign-in');
        router.refresh();
      } else {
        document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        router.push('/sign-in');
      }
    } catch (error) {
      console.error('Logout error:', error);
      document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      router.push('/sign-in');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 glass-medium border-b border-white/10">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          {/* Left section */}
          <div className="flex items-center space-x-8">
            {/* All Teams Dropdown */}
            <div className="relative">
              <button
                ref={teamsButtonRef}
                onClick={() => setShowTeamsDropdown(!showTeamsDropdown)}
                aria-expanded={showTeamsDropdown}
                aria-haspopup="true"
                aria-label="Open teams menu"
                className="flex items-center space-x-2 glass-light px-3 py-1.5 rounded-lg hover:glass-medium duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-105 active:scale-95"
              >
                <span className="text-sm font-medium text-text-primary">All Teams</span>
                <ChevronDown
                  className={`w-4 h-4 text-text-primary transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    showTeamsDropdown ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showTeamsDropdown && mounted && createPortal(
                <>
                  <div
                    className="fixed inset-0 z-[9998]"
                    onClick={() => setShowTeamsDropdown(false)}
                  />
                  <div
                    ref={teamsDropdownRef}
                    className="fixed w-56 rounded-xl border border-white/10  z-[10000] glass-heavy overflow-hidden animate-fadeIn"
                    style={{
                      top: `${teamsDropdownPosition.top}px`,
                      left: `${teamsDropdownPosition.left}px`
                    }}
                  >
                    <div className="p-2">
                      <div className="px-3 py-2 text-xs text-text-tertiary uppercase tracking-wider font-medium">
                        My Teams
                      </div>
                      <button
                        onClick={() => {
                          setShowTeamsDropdown(false);
                          setShowCreateTeamModal(true);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 hover:backdrop-blur-sm text-text-primary transition-all duration-200 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        <div>
                          <div className="font-medium text-sm">Create Team</div>
                          <div className="text-xs text-text-tertiary">Add a new team</div>
                        </div>
                      </button>
                      {teams.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-text-tertiary">
                          No teams yet
                        </div>
                      ) : (
                        teams.map((team) => (
                          <button
                            key={team.id}
                            onClick={() => {
                              setShowTeamsDropdown(false);
                              router.push(`/team?teamId=${team.id}`);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 hover:backdrop-blur-sm text-text-primary transition-all duration-200"
                          >
                            <div className="font-medium text-sm">{team.name}</div>
                            {team.description && (
                              <div className="text-xs text-text-tertiary">{team.description}</div>
                            )}
                          </button>
                        ))
                      )}
                      <div className="px-3 py-2 mt-2 text-xs text-text-tertiary uppercase tracking-wider font-medium border-t border-white/10">
                        Friends
                      </div>
                      {friends.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-text-tertiary">
                          No friends yet
                        </div>
                      ) : (
                        friends.slice(0, 5).map((friendship) => {
                          const friend = friendship.friend || { id: friendship.senderId === user?.id ? friendship.receiverId : friendship.senderId };
                          return (
                            <button
                              key={friendship.id}
                              onClick={() => {
                                setShowTeamsDropdown(false);
                                router.push(`/profile/${friend.id}`);
                              }}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 hover:backdrop-blur-sm text-text-primary transition-all duration-200"
                            >
                              <div className="font-medium text-sm">{friend.fullName || friend.username || `Friend #${friend.id}`}</div>
                              {friend.email && (
                                <div className="text-xs text-text-tertiary">{friend.email}</div>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>,
                document.body
              )}
            </div>
          </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative flex items-center">
            <div className="absolute left-3 flex items-center h-full pointer-events-none">
              <Search className="w-4 h-4 text-text-tertiary" />
            </div>
            <input
              type="text"
              placeholder="Search"
              aria-label="Search projects and tasks"
              className="glass-medium border border-white/10 pl-10 pr-4 py-2 rounded-lg text-text-primary placeholder:text-text-tertiary text-sm w-32 sm:w-48 md:w-64 focus:border-primary/50 focus:outline-none transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
            />
          </div>

          {/* Notifications */}
          <NotificationBell />

          {/* User profile dropdown */}
          <div className="relative pl-4 border-l border-white/10">
            <button
              ref={userButtonRef}
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              aria-expanded={showUserDropdown}
              aria-haspopup="true"
              aria-label="Open user menu"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200"
            >
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold flex-shrink-0">
                {initials}
              </div>
              {user && (
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-text-primary">
                    {user.fullName || user.username}
                  </div>
                  <div className="text-xs text-text-tertiary">{user.email}</div>
                </div>
              )}
              <ChevronDown 
                className={`w-4 h-4 text-text-secondary transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] flex-shrink-0 ${
                  showUserDropdown ? 'rotate-180' : ''
                }`} 
              />
            </button>

            {showUserDropdown && mounted && createPortal(
              <>
                <div
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setShowUserDropdown(false)}
                />
                <div
                  ref={userDropdownRef}
                  className="fixed w-64 rounded-xl border border-white/10  z-[10000] glass-heavy overflow-hidden animate-fadeIn"
                  style={{
                    top: `${userDropdownPosition.top}px`,
                    right: `${userDropdownPosition.right}px`
                  }}
                >
                  <div className="p-2">
                    {/* User Info */}
                    <div className="px-3 py-3 border-b border-white/10">
                      <div className="font-semibold text-text-primary text-sm">
                        {user?.fullName || user?.username}
                      </div>
                      <div className="text-xs text-text-tertiary mt-0.5">{user?.email}</div>
                    </div>

                    {/* Menu Items */}
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        router.push('/settings');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 hover:backdrop-blur-sm text-text-primary transition-all duration-200 mt-2"
                    >
                      ⚙️ Settings
                    </button>
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        router.push('/friends');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 hover:backdrop-blur-sm text-text-primary transition-all duration-200"
                    >
                      👥 Friends
                    </button>
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        router.push('/payment');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 hover:backdrop-blur-sm text-text-primary transition-all duration-200"
                    >
                      💳 Billing
                    </button>

                    {/* Sign Out */}
                    <div className="border-t border-white/10 mt-2 pt-2">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          handleSignOut();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-danger/20 hover:backdrop-blur-sm text-danger transition-all duration-200"
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </>,
              document.body
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Create Team Modal */}
      {showCreateTeamModal && mounted && createPortal(
        <>
          <div
            className="fixed inset-0 z-[10001] bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateTeamModal(false)}
          />
          <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4">
            <div
              className="w-full max-w-md glass-medium rounded-2xl border border-white/10  p-6 animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold gradient-text mb-4">Create New Team</h2>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg glass-light border border-white/10 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter team name"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg glass-light border border-white/10 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Enter team description"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateTeamModal(false);
                      setTeamName('');
                      setTeamDescription('');
                    }}
                    className="flex-1 px-4 py-2 glass-light hover:glass-medium rounded-lg text-text-primary transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingTeam || !teamName.trim()}
                    className="flex-1 px-4 py-2 glass-button text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {creatingTeam ? 'Creating...' : 'Create Team'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
});
