'use client';

import type { CSSProperties, Dispatch, ReactNode, SetStateAction } from 'react';
import type { Modifier } from '@dnd-kit/core';
import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import dynamic from 'next/dynamic';
import {
  FolderKanban,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  MessageSquare,
  GripVertical,
  Minus,
  Plus,
  SlidersHorizontal,
  Undo2,
  X,
  Save,
  Grid3x3,
} from 'lucide-react';
import { StatsCard } from '@/components/StatsCard';
import { ProjectCard } from '@/components/ProjectCard';
import { api, Project, Stats } from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader } from '@/components/Loader';

// Lazy load heavy components
const CalendarView = dynamic(() => import('@/components/CalendarView').then(m => ({ default: m.CalendarView })), {
  ssr: false,
  loading: () => <div className="glass-medium rounded-2xl p-6 h-96 animate-pulse" />
});

const BudgetTracking = dynamic(() => import('@/components/BudgetTracking').then(m => ({ default: m.BudgetTracking })), {
  loading: () => <div className="glass-medium rounded-2xl p-6 h-64 animate-pulse" />
});

const ProgressSection = dynamic(() => import('@/components/ProgressSection').then(m => ({ default: m.ProgressSection })), {
  loading: () => <div className="glass-medium rounded-2xl p-6 h-48 animate-pulse" />
});

const UpcomingTasks = dynamic(() => import('@/components/UpcomingTasks').then(m => ({ default: m.UpcomingTasks })), {
  loading: () => <div className="glass-medium rounded-2xl p-6 h-96 animate-pulse" />
});
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';
import { cn } from '@/lib/utils';

type WidgetRenderContext = {
  stats: Stats;
  projects: Project[];
  refreshKey: number;
  setRefreshKey: Dispatch<SetStateAction<number>>;
  router: ReturnType<typeof useRouter>;
};

type DashboardWidgetDefinition = {
  id: string;
  label: string;
  description: string;
  render: (context: WidgetRenderContext) => ReactNode;
  className?: string;
  defaultSize: (typeof AVAILABLE_WIDTHS)[number];
};

const LOCAL_STORAGE_KEY = 'psa-dashboard-widgets-v1';

const DEFAULT_WIDGETS: string[] = [
  'stats-overview',
  'budget-tracking',
  'recent-projects',
  'calendar',
  'progress',
  'upcoming-tasks',
];

const AVAILABLE_WIDTHS = [3, 4, 6, 8, 12] as const;

const COL_SPAN_CLASSES: Record<number, string> = {
  3: 'xl:col-span-3',
  4: 'xl:col-span-4',
  6: 'xl:col-span-6',
  8: 'xl:col-span-8',
  12: 'xl:col-span-12',
};

const DEFAULT_GRID_PATTERN = 96;

const DASHBOARD_GRID_BASE: CSSProperties = {
  backgroundImage:
    'linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.35))',
};

const isAvailableWidth = (
  value: number
): value is (typeof AVAILABLE_WIDTHS)[number] =>
  AVAILABLE_WIDTHS.some((width) => width === value);

const createGridSnapModifier = (gridSize: number): Modifier => {
  return ({ transform, active }) => {
    if (!transform) return transform;
    if (!active?.data?.current?.gridSnap) return transform;

    const safeGridSize = gridSize > 0 ? gridSize : 1;
    const snappedX = Math.round(transform.x / safeGridSize) * safeGridSize;
    const snappedY = Math.round(transform.y / safeGridSize) * safeGridSize;

    return {
      ...transform,
      x: snappedX,
      y: snappedY,
    };
  };
};

const StatsOverviewWidget = memo(function StatsOverviewWidget({ stats, projects }: { stats: Stats; projects: Project[] }) {
  const highRiskCount = projects.filter(
    (project) => project.risk_level === 'HIGH' || project.risk_level === 'CRITICAL'
  ).length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatsCard
        title="Projects In Progress"
        value={stats.projects_in_progress}
        icon={FolderKanban}
        iconBgColor="bg-red-500"
        trend={stats.trends?.projects_in_progress}
      />
      <StatsCard
        title="Completion Rate"
        value={`${stats.completion_rate}%`}
        icon={TrendingUp}
        iconBgColor="bg-orange-500"
      />
      <StatsCard
        title="Total Projects"
        value={stats.total_projects}
        icon={CheckCircle}
        iconBgColor="bg-blue-500"
        trend={stats.trends?.total_projects}
      />
      <StatsCard
        title="High Risk Projects"
        value={highRiskCount}
        icon={AlertCircle}
        iconBgColor="bg-yellow-500"
      />
    </div>
  );
});

const RecentProjectsWidget = memo(function RecentProjectsWidget({
  projects,
  router,
}: {
  projects: Project[];
  router: ReturnType<typeof useRouter>;
}) {
  const displayedProjects = projects.slice(0, 4);

  return (
    <div className="glass-medium rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-text-primary">Recent Projects</h3>
        <button
          onClick={() => router.push('/projects')}
          className="text-sm text-[#8098F9] transition-colors hover:text-[#a0b0fc]"
        >
          View All
        </button>
      </div>
      {displayedProjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {displayedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              {...project}
              team={['JD', 'SK', 'MR', 'AR', 'TC', 'LM']}
              onClick={() => router.push(`/projects/${project.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FolderKanban className="mx-auto mb-3 h-12 w-12 text-text-tertiary" />
          <p className="text-text-secondary">No projects yet. Start by analyzing your first project!</p>
          <button
            onClick={() => router.push('/projects/new')}
            className="glass-button mt-4 rounded-lg px-4 py-2 text-white"
          >
            New Analysis
          </button>
        </div>
      )}
    </div>
  );
});

function WidgetLibraryItem({
  definition,
  isSelected,
  onToggle,
}: {
  definition: DashboardWidgetDefinition;
  isSelected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start space-x-3 rounded-xl border border-white/10 p-3 transition-all',
        isSelected ? 'glass-light ring-1 ring-primary/60' : 'glass-subtle hover:glass-light'
      )}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(definition.id)}
        className="mt-1 h-4 w-4 rounded border-white/30 bg-transparent text-primary focus:ring-primary"
      />
      <div>
        <p className="text-sm font-semibold text-text-primary">{definition.label}</p>
        <p className="text-xs text-text-tertiary">{definition.description}</p>
      </div>
    </label>
  );
}

function DashboardCustomizationPanel({
  selectedWidgets,
  availableWidgets,
  onToggleWidget,
  onReset,
}: {
  selectedWidgets: string[];
  availableWidgets: DashboardWidgetDefinition[];
  onToggleWidget: (id: string) => void;
  onReset: () => void;
}) {
  const selectedDefinitions = selectedWidgets
    .map((id) => availableWidgets.find((widget) => widget.id === id))
    .filter((widget): widget is DashboardWidgetDefinition => Boolean(widget));

  return (
    <div className="glass-medium rounded-2xl border border-white/10 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Customize dashboard</h2>
          <p className="text-sm text-text-tertiary">
            Drag to reorder selected widgets, or use the library to show and hide sections.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-text-secondary transition-all hover:border-primary/60 hover:text-text-primary"
          >
            <Undo2 className="h-3.5 w-3.5" />
            Reset to default
          </button>
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-tertiary">
            Selected widgets
          </h3>
          <div className="space-y-3">
            {selectedDefinitions.length > 0 ? (
              selectedDefinitions.map((widget) => (
                <div
                  key={widget.id}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-transparent px-3 py-2 transition-all glass-subtle hover:glass-light"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary">{widget.label}</p>
                    <p className="text-xs text-text-tertiary">{widget.description}</p>
                  </div>
                  <span className="rounded bg-white/10 px-2 py-1 text-[11px] font-medium text-text-secondary">
                    Drag tiles on the dashboard to reorder
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleWidget(widget.id)}
                    className="text-xs text-text-tertiary transition-colors hover:text-danger"
                  >
                    Hide
                  </button>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-sm text-text-tertiary">
                No widgets selected. Use the library to enable widgets.
              </div>
            )}
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-tertiary">
            Widget library
          </h3>
          <div className="space-y-3">
            {availableWidgets.map((widget) => (
              <WidgetLibraryItem
                key={widget.id}
                definition={widget}
                isSelected={selectedWidgets.includes(widget.id)}
                onToggle={onToggleWidget}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const AVAILABLE_WIDGETS: DashboardWidgetDefinition[] = [
  {
    id: 'stats-overview',
    label: 'Project Stats Overview',
    description: 'Key metrics for ongoing projects and completion trends.',
    className: '',
    defaultSize: 12,
    render: ({ stats, projects }) => <StatsOverviewWidget stats={stats} projects={projects} />,
  },
  {
    id: 'budget-tracking',
    label: 'Budget Tracking',
    description: 'Monitor spend, remaining budget, and forecast insights.',
    className: '',
    defaultSize: 4,
    render: () => <BudgetTracking />,
  },
  {
    id: 'recent-projects',
    label: 'Recent Projects',
    description: 'Quick access to the projects you worked on most recently.',
    className: '',
    defaultSize: 6,
    render: ({ projects, router }) => <RecentProjectsWidget projects={projects} router={router} />,
  },
  {
    id: 'calendar',
    label: 'Calendar',
    description: 'Plan tasks across the calendar and drag tasks onto dates.',
    className: '',
    defaultSize: 8,
    render: ({ refreshKey }) => <CalendarView refreshKey={refreshKey} />,
  },
  {
    id: 'progress',
    label: 'Progress Overview',
    description: 'See task completion and time tracking progress.',
    className: '',
    defaultSize: 4,
    render: () => <ProgressSection />,
  },
  {
    id: 'upcoming-tasks',
    label: 'Upcoming Tasks',
    description: 'Prioritize what’s next and drag tasks onto the calendar.',
    className: '',
    defaultSize: 4,
    render: ({ refreshKey }) => <UpcomingTasks key={refreshKey} />,
  },
];

const DEFAULT_WIDGET_SIZE_MAP: Record<string, (typeof AVAILABLE_WIDTHS)[number]> = AVAILABLE_WIDGETS.reduce(
  (acc, widget) => {
    acc[widget.id] = widget.defaultSize;
    return acc;
  },
  {} as Record<string, (typeof AVAILABLE_WIDTHS)[number]>
);

const getDefaultWidgetSize = (id: string): (typeof AVAILABLE_WIDTHS)[number] =>
  DEFAULT_WIDGET_SIZE_MAP[id] ?? AVAILABLE_WIDTHS[0];

const DashboardWidgetContainer = memo(function DashboardWidgetContainer({
  widget,
  size,
  onResize,
  onRemove,
  children,
}: {
  widget: DashboardWidgetDefinition;
  size: (typeof AVAILABLE_WIDTHS)[number];
  onResize: (id: string, direction: 'increase' | 'decrease') => void;
  onRemove: (id: string) => void;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
    data: { type: 'widget-grid', gridSnap: true },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const colSpanClass = COL_SPAN_CLASSES[size] ?? 'xl:col-span-6';
  const sizeIndex = AVAILABLE_WIDTHS.indexOf(size as (typeof AVAILABLE_WIDTHS)[number]);
  const canDecrease = sizeIndex > 0;
  const canIncrease = sizeIndex > -1 && sizeIndex < AVAILABLE_WIDTHS.length - 1;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative col-span-1',
        colSpanClass,
        widget.className,
        isDragging && 'z-20 opacity-75'
      )}
    >
      <div className="pointer-events-none absolute right-3 top-3 z-20 flex items-center gap-1 rounded-lg bg-black/40 px-2 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          className="pointer-events-auto cursor-grab rounded p-1 transition-colors hover:bg-white/20 active:cursor-grabbing"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="pointer-events-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => onResize(widget.id, 'decrease')}
            disabled={!canDecrease}
            className={cn(
              'rounded p-1 transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40'
            )}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[1.5rem] text-center text-[11px] leading-none">{size}</span>
          <button
            type="button"
            onClick={() => onResize(widget.id, 'increase')}
            disabled={!canIncrease}
            className={cn(
              'rounded p-1 transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40'
            )}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="pointer-events-auto ml-1 h-4 w-px bg-white/20" />
        <button
          type="button"
          onClick={() => onRemove(widget.id)}
          className="pointer-events-auto rounded p-1 transition-colors hover:bg-red-500/30 hover:text-red-300"
          title="Remove widget"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className={cn('h-full', isDragging && 'pointer-events-none')}>
        {children}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.widget.id === nextProps.widget.id &&
    prevProps.size === nextProps.size &&
    prevProps.children === nextProps.children
  );
});

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    projects_in_progress: 0,
    total_projects: 0,
    completion_rate: 0,
    projects_completed: 0,
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [selectedWidgets, setSelectedWidgets] = useState<string[]>(DEFAULT_WIDGETS);
  const [widgetSizes, setWidgetSizes] = useState<
    Record<string, (typeof AVAILABLE_WIDTHS)[number]>
  >(() => ({
    ...DEFAULT_WIDGET_SIZE_MAP,
  }));
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const [gridPatternSize, setGridPatternSize] = useState<number>(DEFAULT_GRID_PATTERN);
  const hasLoadedFromStorage = useRef(false);
  const [gridColumns, setGridColumns] = useState<12 | 16 | 24>(12);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  const widgetGridSnapModifier = useMemo(
    () => createGridSnapModifier(Math.max(gridPatternSize, 1)),
    [gridPatternSize]
  );
  const gridBackgroundStyle = useMemo(
    () => ({
      ...DASHBOARD_GRID_BASE,
      backgroundSize: `${Math.max(gridPatternSize, 1)}px ${Math.max(gridPatternSize, 1)}px`,
    }),
    [gridPatternSize]
  );
  const updateGridMetrics = useCallback(() => {
    if (typeof window === 'undefined') return;
    const node = gridRef.current;
    if (!node) return;

    const computedStyle = window.getComputedStyle(node);
    const templateColumns = computedStyle.gridTemplateColumns || '';
    let columns = 12;
    const repeatMatch = templateColumns.match(/repeat\((\d+)/);
    if (repeatMatch && repeatMatch[1]) {
      const parsed = parseInt(repeatMatch[1], 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        columns = parsed;
      }
    } else if (templateColumns.length > 0) {
      const parts = templateColumns
        .split(' ')
        .map((part) => part.trim())
        .filter((part) => part.length > 0 && part !== '/');
      if (parts.length > 0) {
        columns = parts.length;
      }
    }

    if (!Number.isFinite(columns) || columns <= 0) {
      columns = 1;
    }

    const rawGap =
      parseFloat(computedStyle.columnGap || computedStyle.gap || computedStyle.rowGap || '0') || 0;
    const gap = Number.isFinite(rawGap) && rawGap >= 0 ? rawGap : 0;

    const width = node.clientWidth;
    if (width <= 0) return;

    const cellWidth = (width - gap * (columns - 1)) / columns;
    if (!Number.isFinite(cellWidth) || cellWidth <= 0) return;

    const pattern = cellWidth + gap;
    if (!Number.isFinite(pattern) || pattern <= 0) return;

    setGridPatternSize(pattern);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      hasLoadedFromStorage.current = true;
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed.selectedWidgets)) {
        const validWidgets = parsed.selectedWidgets.filter((id: unknown): id is string =>
          AVAILABLE_WIDGETS.some((widget) => widget.id === id)
        );
        if (validWidgets.length > 0) {
          setSelectedWidgets(validWidgets);
        }
      }
      if (parsed.widgetSizes && typeof parsed.widgetSizes === 'object') {
        const restoredSizes: Record<string, (typeof AVAILABLE_WIDTHS)[number]> = {
          ...DEFAULT_WIDGET_SIZE_MAP,
        };
        AVAILABLE_WIDGETS.forEach((widget) => {
          const rawSize = parsed.widgetSizes[widget.id];
          if (typeof rawSize === 'number' && isAvailableWidth(rawSize)) {
            restoredSizes[widget.id] = rawSize;
          }
        });
        setWidgetSizes(restoredSizes);
      }
      if (typeof parsed.gridColumns === 'number' && [12, 16, 24].includes(parsed.gridColumns)) {
        setGridColumns(parsed.gridColumns as 12 | 16 | 24);
      }
      hasLoadedFromStorage.current = true;
    } catch (error) {
      console.warn('Failed to parse dashboard widget configuration:', error);
      hasLoadedFromStorage.current = true;
    }
  }, []);

  // Track unsaved changes instead of auto-saving
  useEffect(() => {
    if (!hasLoadedFromStorage.current) return;
    setHasUnsavedChanges(true);
  }, [selectedWidgets, widgetSizes, gridColumns]);

  const loadData = async () => {
    try {
      const [statsData, projectsData] = await Promise.all([api.getStats(), api.getProjects()]);
      setStats(statsData);
      setProjects(projectsData.projects || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.task) {
      setActiveTask(active.data.current.task);
    }
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;

    const itemType = active.data.current?.type;

    if (itemType === 'widget-grid' || itemType === 'widget-control') {
      if (over && active.id !== over.id) {
        setSelectedWidgets((items) => {
          const oldIndex = items.indexOf(active.id as string);
          const newIndex = items.indexOf(over.id as string);
          if (oldIndex === -1 || newIndex === -1) return items;
          return arrayMove(items, oldIndex, newIndex);
        });
      }
      return;
    }

    setActiveTask(null);
    
    if (!over) return;

    const taskId = typeof active.id === 'number' ? active.id : parseInt(active.id as string, 10);
    const dateId = over.id;

    if (Number.isNaN(taskId)) {
      return;
    }

    if (typeof dateId === 'string' && dateId.startsWith('date-')) {
      const dateStr = dateId.replace('date-', '');
      const originalTask = active.data.current?.task;
      
      try {
        if (originalTask?.start_date && originalTask?.end_date) {
          const startDate = new Date(originalTask.start_date);
          const endDate = new Date(originalTask.end_date);
          const duration = Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          const newStartDate = new Date(dateStr);
          const newEndDate = new Date(newStartDate);
          newEndDate.setDate(newStartDate.getDate() + duration);
          
          await axios.put(`/api/tasks/${taskId}`, {
            start_date: newStartDate.toISOString().split('T')[0],
            due_date: dateStr,
            end_date: newEndDate.toISOString().split('T')[0],
          });
        } else {
          await axios.put(`/api/tasks/${taskId}`, {
            due_date: dateStr,
          });
        }
        
        setRefreshKey((prev) => prev + 1);
        toast.success('Task date updated successfully');
      } catch (error: any) {
        console.error('Failed to update task due date:', error);
        toast.error(`Failed to update task: ${error.response?.data?.error || error.message}`);
      }
    }
  }, [setRefreshKey]);

  const widgetMap = useMemo(() => {
    const map = new Map<string, DashboardWidgetDefinition>();
    AVAILABLE_WIDGETS.forEach((widget) => map.set(widget.id, widget));
    return map;
  }, []);

  const renderableWidgets = useMemo(
    () =>
      selectedWidgets
        .map((id) => widgetMap.get(id))
        .filter((widget): widget is DashboardWidgetDefinition => Boolean(widget)),
    [selectedWidgets, widgetMap]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (renderableWidgets.length === 0) return;

    const node = gridRef.current;
    if (!node) return;

    let animationFrame: number | null = null;

    const handleResize = () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      animationFrame = window.requestAnimationFrame(() => {
        updateGridMetrics();
      });
    };

    updateGridMetrics();

    const resizeObserver =
      'ResizeObserver' in window ? new ResizeObserver(handleResize) : undefined;
    resizeObserver?.observe(node);
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      resizeObserver?.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [renderableWidgets.length, updateGridMetrics]);

  const handleResizeWidget = useCallback((id: string, direction: 'increase' | 'decrease') => {
    setWidgetSizes((prev) => {
      const currentSize = prev[id] ?? getDefaultWidgetSize(id);
      const alignedSize = isAvailableWidth(currentSize) ? currentSize : getDefaultWidgetSize(id);
      const currentIndex = AVAILABLE_WIDTHS.indexOf(alignedSize);
      if (currentIndex === -1) {
        return { ...prev, [id]: getDefaultWidgetSize(id) };
      }
      const nextIndex =
        direction === 'increase'
          ? Math.min(currentIndex + 1, AVAILABLE_WIDTHS.length - 1)
          : Math.max(currentIndex - 1, 0);
      if (nextIndex === currentIndex) {
        return prev;
      }
      return {
        ...prev,
        [id]: AVAILABLE_WIDTHS[nextIndex],
      };
    });
  }, []);

  const handleToggleWidget = useCallback((id: string) => {
    setSelectedWidgets((current) => {
      const exists = current.includes(id);
      if (exists) {
        return current.filter((widgetId) => widgetId !== id);
      }
      setWidgetSizes((prev) => {
        if (prev[id]) {
          return prev;
        }
        return {
          ...prev,
          [id]: getDefaultWidgetSize(id),
        };
      });
      return [...current, id];
    });
  }, []);

  const handleResetWidgets = useCallback(() => {
    setSelectedWidgets(DEFAULT_WIDGETS);
    setWidgetSizes({ ...DEFAULT_WIDGET_SIZE_MAP });
    setGridColumns(12);
  }, []);

  const handleSaveDashboard = async () => {
    setIsSaving(true);
    try {
      const config = {
        selectedWidgets,
        widgetSizes,
        gridColumns,
        updatedAt: new Date().toISOString(),
      };

      // Save to localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
      }

      // Save to database
      await axios.post('/api/dashboard/layout', config);

      setHasUnsavedChanges(false);
      toast.success('Dashboard layout saved successfully');
    } catch (error: any) {
      console.error('Failed to save dashboard layout:', error);
      toast.error('Failed to save dashboard layout');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <Loader message="Loading your personalized dashboard..." />;
  }

  const gridColsClass =
    gridColumns === 24 ? 'xl:grid-cols-24' :
    gridColumns === 16 ? 'xl:grid-cols-16' :
    'xl:grid-cols-12';

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[widgetGridSnapModifier]}
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold text-text-primary">Dashboard overview</h1>
            <p className="text-sm text-text-tertiary">
              Tailor the workspace by choosing which widgets appear on your home view.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Grid Density Selector - только в режиме кастомизации */}
            {isCustomizationOpen && (
              <div className="flex items-center gap-1 rounded-lg border border-white/10 p-1">
                <button
                  type="button"
                  onClick={() => setGridColumns(12)}
                  className={cn(
                    "flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-semibold transition-all",
                    gridColumns === 12
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "text-text-tertiary hover:text-text-secondary"
                  )}
                  title="12 columns (Standard)"
                >
                  <Grid3x3 className="h-3.5 w-3.5" />
                  12
                </button>
                <button
                  type="button"
                  onClick={() => setGridColumns(16)}
                  className={cn(
                    "flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-semibold transition-all",
                    gridColumns === 16
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "text-text-tertiary hover:text-text-secondary"
                  )}
                  title="16 columns (Wide)"
                >
                  <Grid3x3 className="h-3.5 w-3.5" />
                  16
                </button>
                <button
                  type="button"
                  onClick={() => setGridColumns(24)}
                  className={cn(
                    "flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-semibold transition-all",
                    gridColumns === 24
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "text-text-tertiary hover:text-text-secondary"
                  )}
                  title="24 columns (Ultrawide)"
                >
                  <Grid3x3 className="h-3.5 w-3.5" />
                  24
                </button>
              </div>
            )}

            {/* Customize Button */}
            <button
              type="button"
              onClick={() => setIsCustomizationOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-text-secondary transition-all hover:border-primary/60 hover:text-text-primary"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {isCustomizationOpen ? 'Hide customization' : 'Customize dashboard'}
            </button>

            {/* Save Button - только в режиме кастомизации */}
            {isCustomizationOpen && hasUnsavedChanges && (
              <button
                type="button"
                onClick={handleSaveDashboard}
                disabled={isSaving}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                  "bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30",
                  isSaving && "opacity-50 cursor-not-allowed"
                )}
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Layout'}
              </button>
            )}
          </div>
        </div>

        {isCustomizationOpen && (
          <DashboardCustomizationPanel
            selectedWidgets={selectedWidgets}
            availableWidgets={AVAILABLE_WIDGETS}
            onToggleWidget={handleToggleWidget}
            onReset={handleResetWidgets}
          />
        )}

        {/* Customize Mode Indicator */}
        {isCustomizationOpen && (
          <div className="glass-medium rounded-xl border border-primary/30 p-4 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Customize Mode Active
                </p>
                <p className="text-xs text-text-tertiary">
                  Drag widgets to reorder • Resize using +/- controls • Remove with X button
                </p>
              </div>
            </div>
            {hasUnsavedChanges && (
              <span className="text-xs px-2 py-1 rounded-full bg-warning/20 text-warning border border-warning/30">
                Unsaved Changes
              </span>
            )}
          </div>
        )}

        {renderableWidgets.length > 0 ? (
          <div className={cn(
            "relative rounded-3xl border p-4 transition-all duration-300",
            isCustomizationOpen
              ? "border-primary/30 bg-primary/5"
              : "border-white/5 bg-white/0 hover:border-white/10"
          )}>
            <div
              className="pointer-events-none absolute inset-0 rounded-[22px] opacity-60"
              style={gridBackgroundStyle}
            />
            <div className="relative">
              <SortableContext
                items={renderableWidgets.map((widget) => widget.id)}
                strategy={rectSortingStrategy}
              >
                <div ref={gridRef} className={cn("grid grid-cols-1 gap-6", gridColsClass)}>
                  {renderableWidgets.map((widget) => {
                    const widgetSize = widgetSizes[widget.id] ?? widget.defaultSize;
                    return (
                      <DashboardWidgetContainer
                        key={widget.id}
                        widget={widget}
                        size={widgetSize}
                        onResize={handleResizeWidget}
                        onRemove={handleToggleWidget}
                      >
                        {widget.render({
                          stats,
                          projects,
                          refreshKey,
                          setRefreshKey,
                          router,
                        })}
                      </DashboardWidgetContainer>
                    );
                  })}
                </div>
              </SortableContext>
            </div>
          </div>
        ) : (
          <div className={cn("grid grid-cols-1 gap-6", gridColsClass)}>
            <div className="col-span-full rounded-2xl border border-dashed border-white/10 p-12 text-center">
              <p className="text-lg font-semibold text-text-primary">Your dashboard is empty</p>
              <p className="mt-2 text-sm text-text-tertiary">
                Turn widgets back on in the customization panel to start building your view.
              </p>
            </div>
          </div>
        )}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="glass-medium rotate-2 rounded-xl border border-white/20 bg-[#8098F9]/10 p-3 backdrop-blur-xl">
            <div className="flex items-center space-x-3">
              <div className="glass-light flex h-8 w-8 items-center justify-center rounded-lg">
                <MessageSquare className="h-4 w-4 text-[#8098F9]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-text-primary">{activeTask.title}</div>
                {activeTask.due_date && (
                  <div className="text-xs text-text-tertiary">
                    {new Date(activeTask.due_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
