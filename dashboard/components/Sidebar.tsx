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
import { Logo } from './Logo';

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
    <aside className="fixed left-0 top-0 z-40 h-screen w-20 glass-medium border-r border-white/10">
      <div className="flex h-full flex-col items-center py-6 space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center">
          <Logo variant="icon" showText={false} />
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
                  'flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
                  isActive
                    ? 'glass-light text-white border border-[#8098F9]/40 shadow-[0_0_20px_rgba(128,152,249,0.5)] scale-105'
                    : 'text-white/60 hover:glass-subtle hover:text-white hover:border hover:border-white/10 hover:scale-105 active:scale-95'
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
