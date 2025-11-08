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

export function Sidebar() {
  const pathname = usePathname();
  const { isExpanded, setIsExpanded } = useSidebar();

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen glass-medium border-r border-white/10 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
        isExpanded ? 'w-64' : 'w-20'
      )}
    >
      <div className="flex h-full flex-col py-6">
        {/* Logo Section */}
        <div className={cn('px-4 mb-8 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]', isExpanded ? 'px-6' : 'px-4')}>
          <div className={cn('flex items-center gap-3', isExpanded ? 'justify-between' : 'justify-center')}>
            <Logo variant={isExpanded ? "default" : "icon"} showText={false} />
            <button
              onClick={toggleSidebar}
              className={cn(
                'p-2 rounded-lg glass-light hover:glass-medium transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-110 active:scale-95 flex-shrink-0',
                !isExpanded && 'mx-auto'
              )}
              title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isExpanded ? (
                <ChevronLeft className="w-4 h-4 text-text-primary" />
              ) : (
                <ChevronRight className="w-4 h-4 text-text-primary" />
              )}
            </button>
          </div>
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
                  'flex items-center rounded-xl transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group',
                  isExpanded ? 'px-4 py-3 gap-3' : 'justify-center w-14 h-14 mx-auto',
                  isActive
                    ? 'glass-light text-white border border-[#8098F9]/40 shadow-[0_0_20px_rgba(128,152,249,0.5)] scale-105'
                    : 'text-white/60 hover:glass-subtle hover:text-white hover:border hover:border-white/10 hover:scale-105 active:scale-95'
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
}
