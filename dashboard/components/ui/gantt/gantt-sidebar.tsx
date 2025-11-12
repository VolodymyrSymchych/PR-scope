'use client';

import React, { ReactNode, useState } from 'react';
import { Plus, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGantt } from './gantt-provider';

interface GanttSidebarProps {
  children: ReactNode;
  className?: string;
  ganttType?: 'tasks' | 'projects';
}

export function GanttSidebar({ children, className, ganttType = 'tasks' }: GanttSidebarProps) {
  const { onAddItem } = useGantt();
  const buttonLabel = ganttType === 'projects' ? 'Add Project' : 'Add Task';

  return (
    <div className={cn('w-48 flex-shrink-0 backdrop-blur-xl bg-black/[0.30] border-r border-white/[0.15] overflow-y-auto flex flex-col min-h-0', className)}>
      {onAddItem && (
        <div className="p-4 pb-3 border-b border-white/[0.12]">
          <button
            onClick={() => onAddItem(new Date())}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/40 hover:border-primary/60 text-white font-medium text-sm transition-all duration-200 active:scale-[0.98] shadow-lg shadow-primary/10 hover:shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>{buttonLabel}</span>
          </button>
        </div>
      )}
      <div className="p-4 space-y-2 flex-1">{children}</div>
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
    <div className={cn('space-y-1.5', className)}>
      <div className="text-[11px] font-bold text-white/70 uppercase tracking-widest px-3 py-2.5 mb-1.5 bg-black/[0.15] rounded-lg border border-white/[0.15] backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3.5 bg-primary/60 rounded-full" />
          {name}
        </div>
      </div>
      <div className="space-y-1.5">{children}</div>
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
  onAddSubtask?: (parentId: string) => void;
  className?: string;
  depth?: number;
}

export function GanttSidebarItem({ feature, onSelectItem, onAddSubtask, className, depth = 0 }: GanttSidebarItemProps) {
  const { collapsedTasks, toggleCollapsed } = useGantt();
  const hasChildren = feature.children && feature.children.length > 0;
  const isExpanded = !collapsedTasks.has(feature.id);
  const statusColor = feature.status?.color || 'hsl(var(--text-tertiary) / 0.7)';

  // Extract base color from HSL and use it for sidebar item
  const getStatusBackgroundColor = (color: string) => {
    if (color.includes('hsl')) {
      const match = color.match(/hsl\(([^)]+)\)/);
      if (match) {
        const hslValues = match[1];
        const baseColor = hslValues.split('/')[0].trim();
        // Use high opacity for bright, visible status color
        return `hsl(${baseColor} / 0.80)`;
      }
    }
    return 'hsl(var(--primary) / 0.75)';
  };

  const getStatusBorderColor = (color: string) => {
    if (color.includes('hsl')) {
      const match = color.match(/hsl\(([^)]+)\)/);
      if (match) {
        const hslValues = match[1];
        const baseColor = hslValues.split('/')[0].trim();
        return `hsl(${baseColor} / 0.95)`;
      }
    }
    return 'hsl(var(--primary) / 0.90)';
  };

  return (
    <div style={{ marginLeft: `${depth * 16}px` }}>
      <div
        className={cn(
          'rounded-lg p-3 cursor-pointer active:scale-[0.99] transition-all duration-200 backdrop-blur-sm',
          className
        )}
        style={{
          background: getStatusBackgroundColor(statusColor),
        }}
      >
        <div className="flex items-center justify-between mb-1.5 group/item">
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
            <span
              onClick={onSelectItem}
              className="text-[13px] font-semibold text-white/90 truncate flex-1"
            >
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

      {/* Render children */}
      {hasChildren && isExpanded && (
        <div className="mt-1.5 space-y-1.5">
          {feature.children!.map((child) => (
            <GanttSidebarItem
              key={child.id}
              feature={child}
              onSelectItem={() => console.log('Select child:', child.id)}
              onAddSubtask={onAddSubtask}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

