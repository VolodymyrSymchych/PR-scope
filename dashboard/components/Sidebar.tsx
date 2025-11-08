'use client';

import {
  LayoutDashboard,
  FolderKanban,
  Mail,
  Users,
  Settings,
  CreditCard,
  CheckSquare,
  Clock,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { useSidebar } from './SidebarContext';
import { memo, useCallback } from 'react';

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Timeline', href: '/projects-timeline', icon: Calendar },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Attendance', href: '/attendance', icon: Clock },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar = memo(function Sidebar() {
  const pathname = usePathname();
  const { isExpanded, setIsExpanded } = useSidebar();

  const toggleSidebar = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded, setIsExpanded]);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen glass-medium border-r border-white/10 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
        isExpanded ? 'w-64' : 'w-20'
      )}
    >
      <div className="flex h-full flex-col py-6">
        {/* Logo Section */}
        <div className={cn('mb-8 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]', isExpanded ? 'px-6' : 'px-4')}>
          {isExpanded ? (
            <div className="flex items-center justify-between gap-3">
              <Logo variant="default" showText={false} />
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg glass-light hover:glass-medium duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-110 active:scale-95 flex-shrink-0"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4 text-text-primary" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Logo variant="icon" showText={false} />
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg glass-light hover:glass-medium duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-110 active:scale-95"
                title="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4 text-text-primary" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 px-3">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center rounded-xl duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group',
                  isExpanded ? 'px-4 py-3 gap-3' : 'justify-center w-14 h-14 mx-auto',
                  isActive
                    ? 'glass-light text-white border border-[#8098F9]/40 shadow-[0_0_20px_rgba(128,152,249,0.5)] scale-105'
                    : 'text-white/60 hover:glass-subtle hover:text-white hover:scale-105 active:scale-95'
                )}
                title={!isExpanded ? item.name : undefined}
              >
                <item.icon className={cn('flex-shrink-0', isExpanded ? 'w-5 h-5' : 'w-6 h-6')} />
                {isExpanded && (
                  <span className="font-medium text-sm whitespace-nowrap">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
});
