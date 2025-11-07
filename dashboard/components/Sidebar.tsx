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
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

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

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-20 bg-gray-900 dark:bg-surface-elevated border-r border-transparent dark:border-border">
      <div className="flex h-full flex-col items-center py-8 space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 dark:bg-primary/10">
          <div className="w-8 h-8 rounded-full border-2 border-white/60 dark:border-primary/60 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white/60 dark:bg-primary/60"></div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-xl transition-colors',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                )}
                title={item.name}
              >
                <item.icon className="w-6 h-6" />
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
