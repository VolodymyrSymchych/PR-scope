'use client';

import { Search, Bell, ChevronDown } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import Image from 'next/image';

export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-card-dark border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Left section */}
        <div className="flex items-center space-x-8">
          <h1 className="text-2xl font-bold text-primary-500">Overview</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">All Teams</span>
            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
            />
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
          </button>

          {/* User profile */}
          <div className="flex items-center space-x-3 pl-4 border-l border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
              AR
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Alex Rogue
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Admin</div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
