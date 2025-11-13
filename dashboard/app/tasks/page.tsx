'use client';

import { useEffect, useState } from 'react';
import { Plus, Calendar, Edit, Trash2, ArrowUpDown } from 'lucide-react';
import axios from 'axios';
import { Task } from '@/lib/tasks-api';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EditTaskModal } from '@/components/EditTaskModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';

interface Project {
  id: number;
  name: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; task: any | null }>({
    isOpen: false,
    task: null,
  });
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    project_id: '' as string | number,
    assignee: '',
    due_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'todo' as 'todo' | 'in_progress' | 'done'
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadProjects();
    loadTasks();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/tasks');
      console.log('API Response:', response.data);
      const tasksData = response.data?.tasks || [];
      console.log('Loaded tasks count:', tasksData.length);
      console.log('Tasks data:', tasksData);
      if (Array.isArray(tasksData)) {
        setTasks(tasksData);
      } else {
        console.error('Tasks data is not an array:', tasksData);
        setTasks([]);
      }
    } catch (error: any) {
      console.error('Failed to load tasks:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const taskData = {
        title: newTask.title,
        description: newTask.description || null,
        project_id: newTask.project_id && newTask.project_id !== '' ? parseInt(newTask.project_id as string) : null,
        assignee: newTask.assignee || null,
        due_date: newTask.due_date || null,
        priority: newTask.priority,
        status: newTask.status,
      };
      await axios.post('/api/tasks', taskData);
      setNewTask({
        title: '',
        description: '',
        project_id: '',
        assignee: '',
        due_date: '',
        priority: 'medium',
        status: 'todo'
      });
      setShowNewTaskForm(false);
      loadTasks();
    } catch (error: any) {
      console.error('Failed to create task:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create task. Please try again.';
      alert(errorMessage);
    }
  };

  const updateTaskStatus = async (taskId: number, status: 'todo' | 'in_progress' | 'done') => {
    try {
      await axios.put(`/api/tasks/${taskId}`, { status });
      loadTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const deleteTask = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setDeleteModal({ isOpen: true, task });
    }
  };

  const confirmDeleteTask = async () => {
    if (!deleteModal.task) return;

    try {
      await axios.delete(`/api/tasks/${deleteModal.task.id}`);
      setDeleteModal({ isOpen: false, task: null });
      loadTasks();
    } catch (error: any) {
      console.error('Failed to delete task:', error);
      alert(error.response?.data?.error || 'Failed to delete task. Please try again.');
    }
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id;

    // Find the task being dragged
    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // Determine the new status based on the drop zone
    let newStatus: 'todo' | 'in_progress' | 'done' = 'todo';
    
    // Check if dropped on a column
    if (overId === 'todo' || overId === 'in_progress' || overId === 'done') {
      newStatus = overId as 'todo' | 'in_progress' | 'done';
    } else {
      // If dropped on another task, use that task's status
      const overTask = tasks.find(t => t.id === parseInt(String(overId)));
      if (overTask) {
        const status = overTask.status;
        if (status === 'todo' || status === 'Todo') newStatus = 'todo';
        else if (status === 'in_progress' || status === 'In Progress') newStatus = 'in_progress';
        else if (status === 'done' || status === 'Done') newStatus = 'done';
      }
    }

    // Only update if status changed
    const currentStatus = activeTask.status === 'todo' || activeTask.status === 'Todo' ? 'todo' :
                         activeTask.status === 'in_progress' || activeTask.status === 'In Progress' ? 'in_progress' :
                         'done';
    
    if (currentStatus !== newStatus) {
      await updateTaskStatus(activeId, newStatus);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  // Sort tasks by name (title) within each status
  const sortTasksByName = (taskList: any[]) => {
    if (!Array.isArray(taskList) || taskList.length === 0) return [];
    return [...taskList].sort((a, b) => {
      const aTitle = (a.title || '').toLowerCase();
      const bTitle = (b.title || '').toLowerCase();
      if (sortOrder === 'asc') {
        return aTitle.localeCompare(bTitle);
      } else {
        return bTitle.localeCompare(aTitle);
      }
    });
  };

  // Filter and sort tasks by status
  const todoTasks = sortTasksByName(tasks.filter(t => {
    if (!t) return false;
    const status = String(t.status || '').toLowerCase().trim();
    return status === 'todo' || status === 'to do' || status === '';
  }));
  const inProgressTasks = sortTasksByName(tasks.filter(t => {
    if (!t) return false;
    const status = String(t.status || '').toLowerCase().trim();
    return status === 'in_progress' || status === 'in progress';
  }));
  const doneTasks = sortTasksByName(tasks.filter(t => {
    if (!t) return false;
    const status = String(t.status || '').toLowerCase().trim();
    return status === 'done';
  }));

  // Debug logging
  useEffect(() => {
    console.log('Total tasks:', tasks.length);
    console.log('Todo tasks:', todoTasks.length);
    console.log('In Progress tasks:', inProgressTasks.length);
    console.log('Done tasks:', doneTasks.length);
  }, [tasks, todoTasks, inProgressTasks, doneTasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show message if no tasks at all
  if (!loading && tasks.length === 0) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Tasks</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage and track your tasks
          </p>
        </div>
        <button
          onClick={() => setShowNewTaskForm(!showNewTaskForm)}
          className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:opacity-90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
        </div>

        {/* No tasks message */}
        <div className="glass-medium rounded-xl p-8 border border-white/10 text-center">
          <p className="text-text-secondary mb-4">No tasks found</p>
          <p className="text-xs text-text-tertiary mb-4">
            Create your first task to get started
          </p>
          {!showNewTaskForm && (
            <button
              onClick={() => setShowNewTaskForm(true)}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:opacity-90 transition-colors"
            >
              Create Task
            </button>
          )}
        </div>

        {/* New Task Form */}
        {showNewTaskForm && (
          <div className="glass-medium rounded-xl p-4 border border-white/10">
            <form onSubmit={createTask} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg glass-medium border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg glass-medium border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1.5">
                    Project
                  </label>
                  <select
                    value={newTask.project_id}
                    onChange={(e) => setNewTask({ ...newTask, project_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg glass-medium border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">No Project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1.5">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm rounded-lg glass-medium border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1.5">
                    Assignee
                  </label>
                  <input
                    type="text"
                    value={newTask.assignee}
                    onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg glass-medium border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Initials (e.g., AR)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg glass-medium border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewTaskForm(false)}
                  className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:opacity-90 transition-colors"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Tasks</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage and track your tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSortOrder}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm glass-medium border border-white/10 rounded-lg hover:glass-light transition-colors"
            title={`Sort by name ${sortOrder === 'asc' ? 'A-Z' : 'Z-A'}`}
          >
            <ArrowUpDown className="w-4 h-4" />
            <span className="text-xs">{sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</span>
          </button>
          <button
            onClick={() => setShowNewTaskForm(!showNewTaskForm)}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:opacity-90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* New Task Form */}
      {showNewTaskForm && (
        <div className="glass-medium rounded-xl p-4 border border-white/10">
          <form onSubmit={createTask} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1.5">
                Title *
              </label>
              <input
                type="text"
                required
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg glass-medium border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-primary mb-1.5">
                Description
              </label>
              <textarea
                rows={2}
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg glass-medium border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1.5">
                  Project
                </label>
                <select
                  value={newTask.project_id}
                  onChange={(e) => setNewTask({ ...newTask, project_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg glass-medium border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">No Project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1.5">
                  Priority
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm rounded-lg glass-medium border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1.5">
                  Assignee
                </label>
                <input
                  type="text"
                  value={newTask.assignee}
                  onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg glass-medium border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Initials (e.g., AR)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-primary mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg glass-medium border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowNewTaskForm(false)}
                className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:opacity-90 transition-colors"
              >
                Create Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* To Do Column */}
          <KanbanColumn
            id="todo"
            title="To Do"
            tasks={todoTasks}
            color="bg-gray-400"
            onStatusChange={updateTaskStatus}
            getPriorityColor={getPriorityColor}
            onEdit={(task) => setEditingTask(task)}
            onDelete={deleteTask}
          />

          {/* In Progress Column */}
          <KanbanColumn
            id="in_progress"
            title="In Progress"
            tasks={inProgressTasks}
            color="bg-blue-500"
            onStatusChange={updateTaskStatus}
            getPriorityColor={getPriorityColor}
            onEdit={(task) => setEditingTask(task)}
            onDelete={deleteTask}
          />

          {/* Done Column */}
          <KanbanColumn
            id="done"
            title="Done"
            tasks={doneTasks}
            color="bg-green-500"
            onStatusChange={updateTaskStatus}
            getPriorityColor={getPriorityColor}
            onEdit={(task) => setEditingTask(task)}
            onDelete={deleteTask}
          />
        </div>
        <DragOverlay>
          {activeId ? (
            <div className="glass-medium rounded-xl p-4 border border-white/10 opacity-90 rotate-2">
              <div className="font-semibold text-text-primary">
                {tasks.find(t => t.id === activeId)?.title}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Edit Task Modal */}
      <EditTaskModal
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={() => {
          loadTasks();
          setEditingTask(null);
        }}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Task"
        message="This will mark the task as deleted. This action can be undone by restoring the task from the deleted tasks list."
        itemName={deleteModal.task?.title || ''}
        onConfirm={confirmDeleteTask}
        onCancel={() => setDeleteModal({ isOpen: false, task: null })}
      />
    </div>
  );
}

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: any[];
  color: string;
  onStatusChange: (taskId: number, status: 'todo' | 'in_progress' | 'done') => void;
  getPriorityColor: (priority: string) => string;
  onEdit: (task: any) => void;
  onDelete: (taskId: number) => void;
}

function KanbanColumn({ id, title, tasks, color, onStatusChange, getPriorityColor, onEdit, onDelete }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center space-x-1.5">
          <div className={`w-2 h-2 rounded-full ${color}`}></div>
          <span>{title}</span>
          <span className="text-text-tertiary text-xs">({tasks.length})</span>
        </h3>
      </div>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`space-y-2 min-h-[150px] rounded-lg p-2 transition-colors ${
            isOver ? 'bg-primary/10 border-2 border-primary border-dashed' : ''
          }`}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
              getPriorityColor={getPriorityColor}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-6 text-xs text-text-tertiary">
              No tasks
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

interface TaskCardProps {
  task: any;
  onStatusChange: (taskId: number, status: 'todo' | 'in_progress' | 'done') => void;
  getPriorityColor: (priority: string) => string;
  onEdit: (task: any) => void;
  onDelete: (taskId: number) => void;
}

function SortableTaskCard({ task, onStatusChange, getPriorityColor, onEdit, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="glass-medium rounded-lg p-3 border border-white/10 hover:glass-light transition-all duration-200 hover:scale-[1.01]"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-1.5">
          {/* Draggable area - title and content */}
          <div
            {...listeners}
            className="flex-1 min-w-0 cursor-grab active:cursor-grabbing"
          >
            <h4 className="font-semibold text-sm text-text-primary break-words">{task.title}</h4>
          </div>
          {/* Non-draggable area - edit button, delete button and priority */}
          <div className="flex items-center gap-1 flex-shrink-0 pointer-events-auto">
            <button
              onClick={() => onEdit(task)}
              className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0 cursor-pointer"
              title="Edit task"
            >
              <Edit className="w-3.5 h-3.5 text-text-secondary hover:text-primary" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0 cursor-pointer"
              title="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-300" />
            </button>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${getPriorityColor(task.priority || 'medium')}`}>
              {task.priority || 'medium'}
            </span>
          </div>
        </div>

        {/* Draggable area - description */}
        {task.description && (
          <div {...listeners} className="cursor-grab active:cursor-grabbing">
            <p className="text-xs text-text-secondary line-clamp-2">
              {task.description}
            </p>
          </div>
        )}

        {/* Draggable area - metadata */}
        <div
          {...listeners}
          className="flex items-center justify-between text-xs cursor-grab active:cursor-grabbing"
        >
          {(task.dueDate || task.due_date) && (
            <div className="flex items-center space-x-1 text-text-tertiary">
              <Calendar className="w-3 h-3" />
              <span className="text-[10px]">{new Date((task.dueDate || task.due_date) as string).toLocaleDateString()}</span>
            </div>
          )}
          {task.assignee && (
            <div className="flex items-center space-x-1">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-[10px] font-semibold">
                {task.assignee}
              </div>
            </div>
          )}
        </div>

        {/* Non-draggable area - status buttons */}
        <div className="flex gap-1.5 pt-1.5 border-t border-white/10 pointer-events-auto">
          {task.status !== 'todo' && (
            <button
              onClick={() => onStatusChange(task.id, 'todo')}
              className="flex-1 px-2 py-1 text-[10px] font-semibold rounded glass-light text-text-primary hover:glass-medium transition-all hover:scale-105 cursor-pointer"
            >
              📋 To Do
            </button>
          )}
          {task.status !== 'in_progress' && (
            <button
              onClick={() => onStatusChange(task.id, 'in_progress')}
              className="flex-1 px-2 py-1 text-[10px] font-semibold rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-all hover:scale-105 cursor-pointer"
            >
              ⚡ Progress
            </button>
          )}
          {task.status !== 'done' && (
            <button
              onClick={() => onStatusChange(task.id, 'done')}
              className="flex-1 px-2 py-1 text-[10px] font-semibold rounded bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-all hover:scale-105 cursor-pointer"
            >
              ✓ Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
