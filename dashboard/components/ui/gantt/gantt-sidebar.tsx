'use client';

import React, { ReactNode, useRef, useEffect, useLayoutEffect } from 'react';
import { Plus, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGantt } from './gantt-provider';
import { useScrollSync } from './gantt-timeline';

interface GanttSidebarProps {
  children: ReactNode;
  className?: string;
  ganttType?: 'tasks' | 'projects';
}

export function GanttSidebar({ children, className, ganttType = 'tasks' }: GanttSidebarProps) {
  const { onAddItem } = useGantt();
  const { sidebarScrollRef, contentScrollRef } = useScrollSync();
  const buttonLabel = ganttType === 'projects' ? 'Add Project' : 'Add Task';
  const internalScrollRef = useRef<HTMLDivElement>(null);

  // Use callback ref to set the context ref immediately when element mounts
  const setSidebarRef = (element: HTMLDivElement | null) => {
    internalScrollRef.current = element;
    if (sidebarScrollRef && element) {
      (sidebarScrollRef as React.MutableRefObject<HTMLDivElement | null>).current = element;
    }
  };

  // Sync sidebar scroll with content scroll directly in sidebar component
  useLayoutEffect(() => {
    // Wait a bit for both elements to be ready
    const setupListeners = () => {
      const sidebarEl = internalScrollRef.current;
      const contentEl = contentScrollRef?.current;
      
      if (!sidebarEl || !contentEl) return null;

      let isSyncing = false;

      const handleSidebarScroll = () => {
        if (isSyncing) return;
        
        isSyncing = true;
        contentEl.scrollTop = sidebarEl.scrollTop;
        isSyncing = false;
      };

      const handleContentScroll = () => {
        if (isSyncing) return;
        
        isSyncing = true;
        sidebarEl.scrollTop = contentEl.scrollTop;
        isSyncing = false;
      };

      sidebarEl.addEventListener('scroll', handleSidebarScroll, { passive: true });
      contentEl.addEventListener('scroll', handleContentScroll, { passive: true });

      return () => {
        sidebarEl.removeEventListener('scroll', handleSidebarScroll);
        contentEl.removeEventListener('scroll', handleContentScroll);
      };
    };

    // Try immediately
    let cleanup = setupListeners();
    
    // If not ready, try after delays
    if (!cleanup) {
      const timeouts: NodeJS.Timeout[] = [];
      [10, 50, 100, 200].forEach(delay => {
        const timeout = setTimeout(() => {
          if (!cleanup) {
            cleanup = setupListeners();
          }
        }, delay);
        timeouts.push(timeout);
      });

      return () => {
        timeouts.forEach(clearTimeout);
        if (cleanup) cleanup();
      };
    }

    return cleanup;
  }, [contentScrollRef]);

  return (
    <div className={cn('w-64 flex-shrink-0 backdrop-blur-xl bg-black/[0.30] border-r border-white/[0.15] flex flex-col min-h-0', className)}>
      {onAddItem && (
        <div className="sticky top-0 z-10 p-2 border-b border-white/[0.08] flex items-center" style={{ height: '63px', minHeight: '63px' }}>
          <button
            onClick={() => onAddItem(new Date())}
            className="w-full rounded-lg px-3 py-2 cursor-pointer backdrop-blur-sm border border-white/[0.12] hover:border-white/[0.20] transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              background: 'hsl(var(--primary) / 0.25)',
            }}
          >
            <Plus className="w-4 h-4 text-white/90" />
            <span className="text-[13px] font-semibold text-white/90">{buttonLabel}</span>
          </button>
        </div>
      )}
      <div ref={setSidebarRef} className="p-0 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {children}
      </div>
    </div>
  );
}

interface GanttSidebarGroupProps {
  children: ReactNode;
  name: string;
  className?: string;
}

export function GanttSidebarGroup({ children, name, className }: GanttSidebarGroupProps) {
  return (
    <div className={cn('', className)}>
      <div className="text-[11px] font-bold text-white/70 uppercase tracking-widest px-3 py-2.5 bg-black/[0.15] border border-white/[0.15] backdrop-blur-sm" style={{ height: '63px', minHeight: '63px', display: 'flex', alignItems: 'center' }}>
        <div className="flex items-center gap-2">
          <div className="w-1 h-3.5 bg-primary/60 rounded-full" />
          {name}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

interface GanttSidebarItemProps {
  feature: {
    id: string;
    name: string;
    startAt: Date;
    endAt: Date;
    status?: { id: string; name: string; color: string };
    children?: any[];
  };
  onSelectItem?: () => void;
  onEditItem?: () => void;
  onAddSubtask?: (parentId: string) => void;
  className?: string;
  depth?: number;
}

export function GanttSidebarItem({ feature, onSelectItem, onEditItem, onAddSubtask, className, depth = 0 }: GanttSidebarItemProps) {
  const { collapsedTasks, toggleCollapsed } = useGantt();
  const hasChildren = feature.children && feature.children.length > 0;
  const isExpanded = !collapsedTasks.has(feature.id);
  const statusColor = feature.status?.color || 'hsl(var(--text-tertiary) / 0.7)';

  // Extract base color from HSL and use it for sidebar item
  const getStatusBackgroundColor = (color: string) => {
    // Use gray background for all tasks
    return 'rgba(255, 255, 255, 0.08)';
  };

  return (
    <div style={{ marginLeft: `${depth * 16}px` }}>
      <div
        className={cn(
          'p-2 transition-all duration-200 flex items-center border-b border-white/[0.08]',
          className
        )}
        style={{
          height: '63px',
          minHeight: '63px',
        }}
      >
        <div
          className="w-full rounded-lg px-3 py-2 cursor-pointer backdrop-blur-sm border border-white/[0.12] hover:border-white/[0.20] transition-all duration-200 group/item"
          onClick={onSelectItem}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (onEditItem) {
              onEditItem();
            }
          }}
          style={{
            background: getStatusBackgroundColor(statusColor),
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {hasChildren && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCollapsed(feature.id);
                  }}
                  className="p-0.5 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-white/70" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-white/70" />
                  )}
                </button>
              )}
              <span className="text-[13px] font-semibold text-white/90 truncate flex-1">
                {feature.name}
              </span>
              {hasChildren && (
                <span className="text-[10px] font-bold text-white/60 bg-white/10 px-1.5 py-0.5 rounded-md">
                  {feature.children!.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {onAddSubtask && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddSubtask(feature.id);
                  }}
                  className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-white/10 rounded transition-all flex-shrink-0"
                  title="Add Subtask"
                >
                  <Plus className="w-3 h-3 text-white/70" />
                </button>
              )}
              {feature.status && (
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 ring-1 ring-white/[0.30] transition-all duration-200"
                  style={{ backgroundColor: feature.status.color }}
                />
              )}
            </div>
          </div>
          <div className="text-[11px] text-white/50 font-medium" style={{ marginLeft: hasChildren ? '20px' : '0' }}>
            {feature.startAt.toLocaleDateString()} - {feature.endAt.toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Render children */}
      {hasChildren && isExpanded && (
        <div>
          {feature.children!.map((child) => (
            <GanttSidebarItem
              key={child.id}
              feature={child}
              onSelectItem={() => console.log('Select child:', child.id)}
              onEditItem={onEditItem}
              onAddSubtask={onAddSubtask}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

