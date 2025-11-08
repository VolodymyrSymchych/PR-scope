'use client';

import { useSidebar } from './SidebarContext';
import { cn } from '@/lib/utils';

export function MainContent({ children }: { children: React.ReactNode }) {
  const { isExpanded } = useSidebar();

  return (
    <main
      className={cn(
        'flex-1 transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] relative z-0',
        isExpanded ? 'ml-64' : 'ml-20'
      )}
    >
      {children}
    </main>
  );
}

