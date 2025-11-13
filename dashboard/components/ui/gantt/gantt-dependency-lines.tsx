'use client';

import React, { useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import { useGantt, GanttFeature } from './gantt-provider';

interface DependencyLine {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  type: 'dependency' | 'parent-child';
}

interface GanttDependencyLinesProps {
  features: GanttFeature[];
  className?: string;
}

export function GanttDependencyLines({ features, className }: GanttDependencyLinesProps) {
  const { startDate, pixelsPerDay } = useGantt();

  // Calculate dependency lines
  const dependencyLines = useMemo<DependencyLine[]>(() => {
    const lines: DependencyLine[] = [];
    const taskPositions = new Map<string, { x: number; y: number; width: number; row: number }>();

    // Build a map to track row positions for hierarchical layout
    // This needs to match the row allocation algorithm in gantt-feature-row
    const parentTasks = features.filter(f => !f.parentId);
    const subtasksByParent = new Map<string, GanttFeature[]>();

    features.forEach(f => {
      if (f.parentId) {
        if (!subtasksByParent.has(f.parentId)) {
          subtasksByParent.set(f.parentId, []);
        }
        subtasksByParent.get(f.parentId)!.push(f);
      }
    });

    subtasksByParent.forEach((subtasks) => {
      subtasks.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
    });

    const sortedParents = [...parentTasks].sort((a, b) =>
      a.startAt.getTime() - b.startAt.getTime()
    );

    const subRowEndTimes: Date[] = [];
    let currentRow = 0;

    // Calculate positions using the same algorithm as feature-row
    for (const parent of sortedParents) {
      const subtasks = subtasksByParent.get(parent.id) || [];
      const groupSize = 1 + subtasks.length;

      // Find first free row for the group
      let subRow = 0;
      let foundSlot = false;

      while (!foundSlot) {
        let allFree = true;
        for (let i = 0; i < groupSize; i++) {
          const checkRow = subRow + i;
          if (checkRow < subRowEndTimes.length && subRowEndTimes[checkRow] > parent.startAt) {
            allFree = false;
            break;
          }
        }

        if (allFree) {
          foundSlot = true;
        } else {
          subRow++;
        }
      }

      // Calculate position for parent
      const left = differenceInDays(parent.startAt, startDate) * pixelsPerDay;
      const width = differenceInDays(parent.endAt, parent.startAt) * pixelsPerDay;
      const rowHeight = 63; // Matches sidebar task item height
      const taskHeight = 44;
      const topOffset = 8;
      const y = subRow * rowHeight + topOffset + taskHeight / 2;

      taskPositions.set(parent.id, { x: left, y, width, row: subRow });

      // Update end time for parent row
      if (subRow >= subRowEndTimes.length) {
        subRowEndTimes.push(parent.endAt);
      } else {
        subRowEndTimes[subRow] = parent.endAt;
      }

      // Calculate positions for subtasks
      subtasks.forEach((subtask, index) => {
        const subtaskRow = subRow + 1 + index;
        const subtaskLeft = differenceInDays(subtask.startAt, startDate) * pixelsPerDay;
        const subtaskWidth = differenceInDays(subtask.endAt, subtask.startAt) * pixelsPerDay;
        const subtaskY = subtaskRow * rowHeight + topOffset + taskHeight / 2;

        taskPositions.set(subtask.id, { x: subtaskLeft, y: subtaskY, width: subtaskWidth, row: subtaskRow });

        // Update end time for subtask row
        if (subtaskRow >= subRowEndTimes.length) {
          subRowEndTimes.push(subtask.endAt);
        } else {
          subRowEndTimes[subtaskRow] = subtask.endAt > subRowEndTimes[subtaskRow]
            ? subtask.endAt
            : subRowEndTimes[subtaskRow];
        }
      });
    }

    // Create parent-child lines
    features.forEach((feature) => {
      if (feature.parentId) {
        const parentPos = taskPositions.get(feature.parentId);
        const childPos = taskPositions.get(feature.id);

        if (parentPos && childPos) {
          // Line goes from left of parent to left of child (vertical connector)
          const fromX = parentPos.x;
          const fromY = parentPos.y;
          const toX = childPos.x;
          const toY = childPos.y;

          lines.push({
            id: `parent-child-${feature.parentId}-${feature.id}`,
            fromTaskId: feature.parentId,
            toTaskId: feature.id,
            fromX,
            fromY,
            toX,
            toY,
            color: '#94a3b8', // Slate color for parent-child
            type: 'parent-child',
          });
        }
      }
    });

    // Create dependency lines
    features.forEach((feature) => {
      if (feature.metadata?.task?.dependsOn) {
        // Parse dependsOn field (can be comma-separated string or single ID)
        const dependsOnIds = feature.metadata.task.dependsOn
          .toString()
          .split(',')
          .map((id: string) => id.trim())
          .filter((id: string) => id);

        dependsOnIds.forEach((dependsOnId: string) => {
          const fromPos = taskPositions.get(dependsOnId);
          const toPos = taskPositions.get(feature.id);

          if (fromPos && toPos) {
            // Line goes from end of source task to start of target task
            const fromX = fromPos.x + fromPos.width;
            const fromY = fromPos.y;
            const toX = toPos.x;
            const toY = toPos.y;

            // Use source task color for the line
            const sourceFeature = features.find(f => f.id === dependsOnId);
            const color = sourceFeature?.status?.color || 'hsl(var(--primary) / 0.6)';

            lines.push({
              id: `dep-${dependsOnId}-${feature.id}`,
              fromTaskId: dependsOnId,
              toTaskId: feature.id,
              fromX,
              fromY,
              toX,
              toY,
              color,
              type: 'dependency',
            });
          }
        });
      }
    });

    return lines;
  }, [features, startDate, pixelsPerDay]);

  if (dependencyLines.length === 0) {
    return null;
  }

  return (
    <svg
      className={`absolute inset-0 pointer-events-none ${className || ''}`}
      style={{ zIndex: 5 }}
    >
      <defs>
        {/* Define arrow markers for each color */}
        {Array.from(new Set(dependencyLines.map(line => line.color))).map((color) => {
          const colorId = color.replace(/[^a-z0-9]/gi, '');
          return (
            <marker
              key={colorId}
              id={`arrowhead-${colorId}`}
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path
                d="M0,0 L0,6 L9,3 z"
                fill={color}
                opacity="0.8"
              />
            </marker>
          );
        })}
      </defs>

      {/* Draw dependency lines */}
      {dependencyLines.map((line) => {
        const colorId = line.color.replace(/[^a-z0-9]/gi, '');
        const isParentChild = line.type === 'parent-child';

        // Calculate path
        let pathData: string;
        if (isParentChild) {
          // Simple vertical/L-shaped connector for parent-child
          const offsetX = 15; // Small horizontal offset
          pathData = `
            M ${line.fromX} ${line.fromY}
            L ${line.fromX} ${line.toY}
            L ${line.toX} ${line.toY}
          `;
        } else {
          // Elbow connector for dependencies
          const midX = (line.fromX + line.toX) / 2;
          pathData = `
            M ${line.fromX} ${line.fromY}
            L ${midX} ${line.fromY}
            L ${midX} ${line.toY}
            L ${line.toX - 8} ${line.toY}
          `;
        }

        return (
          <g key={line.id} className="dependency-line group">
            {/* Invisible wider line for easier hovering */}
            <path
              d={pathData}
              fill="none"
              stroke="transparent"
              strokeWidth="12"
              className="pointer-events-auto cursor-pointer"
            />

            {/* Visible line */}
            <path
              d={pathData}
              fill="none"
              stroke={line.color}
              strokeWidth={isParentChild ? "1.5" : "2"}
              strokeOpacity={isParentChild ? "0.4" : "0.6"}
              strokeDasharray={isParentChild ? "4 4" : "none"}
              markerEnd={isParentChild ? undefined : `url(#arrowhead-${colorId})`}
              className={isParentChild
                ? "transition-all duration-200 group-hover:stroke-opacity-60"
                : "transition-all duration-200 group-hover:stroke-opacity-100 group-hover:stroke-[3]"
              }
            />
          </g>
        );
      })}
    </svg>
  );
}
