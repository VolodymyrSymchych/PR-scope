'use client';

import { Search, ChevronDown } from 'lucide-react';
import { NotificationBell } from './notifications/NotificationBell';
import { useEffect, useState, memo, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  username: string;
  fullName?: string | null;
  avatarUrl?: string | null;
}

export const Header = memo(function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [showTeamsDropdown, setShowTeamsDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const teamsDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

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
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (teamsDropdownRef.current && !teamsDropdownRef.current.contains(event.target as Node)) {
        setShowTeamsDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    if (showTeamsDropdown || showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTeamsDropdown, showUserDropdown]);

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
    <header className="sticky top-0 z-[9999] glass-medium border-b border-white/10">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Left section */}
        <div className="flex items-center space-x-8">
          {/* All Teams Dropdown */}
          <div className="relative" ref={teamsDropdownRef}>
            <button
              onClick={() => setShowTeamsDropdown(!showTeamsDropdown)}
              className="flex items-center space-x-2 glass-light px-3 py-1.5 rounded-lg hover:glass-medium duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-105 active:scale-95"
            >
              <span className="text-sm font-medium text-text-primary">All Teams</span>
              <ChevronDown 
                className={`w-4 h-4 text-text-primary transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  showTeamsDropdown ? 'rotate-180' : ''
                }`} 
              />
            </button>

            {showTeamsDropdown && (
              <div className="absolute top-full left-0 mt-2 w-56 rounded-xl border border-white/20 shadow-2xl z-[10000] bg-[#0F1419]/95 backdrop-blur-xl overflow-hidden">
                <div className="p-2">
                  <div className="px-3 py-2 text-xs text-text-tertiary uppercase tracking-wider font-medium">
                    Teams
                  </div>
                  <button 
                    onClick={() => {
                      setShowTeamsDropdown(false);
                      router.push('/projects');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-text-primary transition-colors duration-200"
                  >
                    <div className="font-medium text-sm">All Teams</div>
                    <div className="text-xs text-text-tertiary">View all projects</div>
                  </button>
                  <button 
                    onClick={() => setShowTeamsDropdown(false)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-text-primary transition-colors duration-200"
                  >
                    <div className="font-medium text-sm">Development</div>
                    <div className="text-xs text-text-tertiary">5 members</div>
                  </button>
                  <button 
                    onClick={() => setShowTeamsDropdown(false)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-text-primary transition-colors duration-200"
                  >
                    <div className="font-medium text-sm">Design</div>
                    <div className="text-xs text-text-tertiary">3 members</div>
                  </button>
                  <button 
                    onClick={() => setShowTeamsDropdown(false)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-text-primary transition-colors duration-200"
                  >
                    <div className="font-medium text-sm">Marketing</div>
                    <div className="text-xs text-text-tertiary">2 members</div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
            <input
              type="text"
              placeholder="Search"
              className="glass-medium border border-white/10 pl-10 pr-4 py-2 rounded-lg text-text-primary placeholder:text-text-tertiary text-sm w-64 focus:border-primary/50 focus:outline-none transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
            />
          </div>

          {/* Notifications */}
          <NotificationBell />

          {/* User profile dropdown */}
          <div className="relative pl-4 border-l border-white/10" ref={userDropdownRef}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200"
            >
              <div className="w-10 h-10 rounded-full bg-[#8098F9] flex items-center justify-center text-white font-semibold shadow-[0_0_20px_rgba(128,152,249,0.5)] flex-shrink-0">
                {initials}
              </div>
              {user && (
                <div className="block text-left">
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

            {showUserDropdown && (
              <div className="absolute top-full right-0 mt-2 w-64 rounded-xl border border-white/20 shadow-2xl z-[10000] bg-[#0F1419]/95 backdrop-blur-xl overflow-hidden">
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
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-text-primary transition-colors duration-200 mt-2"
                  >
                    ⚙️ Settings
                  </button>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      router.push('/friends');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-text-primary transition-colors duration-200"
                  >
                    👥 Friends
                  </button>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      router.push('/payment');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-text-primary transition-colors duration-200"
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
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors duration-200"
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});
