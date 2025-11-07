'use client';

import { Search, ChevronDown } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './notifications/NotificationBell';
import Image from 'next/image';

export function Header() {
  return (
    <header className="sticky top-0 z-30 glass-medium border-b border-white/10">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Left section */}
        <div className="flex items-center space-x-8">
          <h1 className="text-2xl font-bold text-[#8098F9]">
            Overview
          </h1>
          <div className="group flex items-center space-x-2 glass-subtle px-3 py-1.5 rounded-lg cursor-pointer hover:glass-light transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-105 active:scale-95">
            <span className="text-sm text-text-secondary">All Teams</span>
            <ChevronDown className="w-4 h-4 text-text-secondary transition-transform duration-300 group-hover:rotate-180" />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search"
              className="glass-input pl-10 pr-4 py-2 rounded-lg text-text-primary placeholder:text-text-tertiary text-sm w-64"
            />
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <NotificationBell />

          {/* User profile */}
          <div className="flex items-center space-x-3 pl-4 border-l border-white/10">
            <div className="w-10 h-10 rounded-full bg-[#8098F9] flex items-center justify-center text-white font-semibold shadow-[0_0_20px_rgba(128,152,249,0.5)]">
              AR
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-semibold text-text-primary">
                Alex Rogue
              </div>
              <div className="text-xs text-text-tertiary">Admin</div>
            </div>
            <ChevronDown className="w-4 h-4 text-text-secondary" />
          </div>
        </div>
      </div>
    </header>
  );
}
