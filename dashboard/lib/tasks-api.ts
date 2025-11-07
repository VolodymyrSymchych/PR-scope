export interface Task {
  id: number;
  title: string;
  description: string;
  project_id?: number;
  assignee: string;
  due_date: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  subtasks: Subtask[];
}

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  completed: boolean;
  created_at: string;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  project_id?: number;
  assignee: string;
  due_date: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  id: number;
}

// Mock data storage
let tasks: Task[] = [
  {
    id: 1,
    title: 'Design new dashboard layout',
    description: 'Create mockups for the new project dashboard with improved UX',
    project_id: 1,
    assignee: 'AR',
    due_date: '2024-12-15',
    status: 'in_progress',
    priority: 'high',
    created_at: '2024-11-01T10:00:00Z',
    updated_at: '2024-11-06T14:30:00Z',
    subtasks: [
      { id: 1, task_id: 1, title: 'Research competitor dashboards', completed: true, created_at: '2024-11-01T10:00:00Z' },
      { id: 2, task_id: 1, title: 'Create wireframes', completed: true, created_at: '2024-11-01T10:00:00Z' },
      { id: 3, task_id: 1, title: 'Design high-fidelity mockups', completed: false, created_at: '2024-11-02T10:00:00Z' },
    ]
  },
  {
    id: 2,
    title: 'Implement user authentication',
    description: 'Set up JWT-based authentication system',
    project_id: 1,
    assignee: 'JD',
    due_date: '2024-12-10',
    status: 'todo',
    priority: 'high',
    created_at: '2024-11-02T09:00:00Z',
    updated_at: '2024-11-02T09:00:00Z',
    subtasks: []
  },
  {
    id: 3,
    title: 'Write API documentation',
    description: 'Document all REST API endpoints with examples',
    project_id: 2,
    assignee: 'SK',
    due_date: '2024-12-20',
    status: 'done',
    priority: 'medium',
    created_at: '2024-10-25T11:00:00Z',
    updated_at: '2024-11-05T16:00:00Z',
    subtasks: [
      { id: 4, task_id: 3, title: 'Document authentication endpoints', completed: true, created_at: '2024-10-25T11:00:00Z' },
      { id: 5, task_id: 3, title: 'Document user endpoints', completed: true, created_at: '2024-10-25T11:00:00Z' },
    ]
  },
  {
    id: 4,
    title: 'Database optimization',
    description: 'Optimize slow queries and add proper indexes',
    project_id: 2,
    assignee: 'MR',
    due_date: '2024-12-18',
    status: 'in_progress',
    priority: 'medium',
    created_at: '2024-11-03T13:00:00Z',
    updated_at: '2024-11-06T10:00:00Z',
    subtasks: []
  },
];

let nextTaskId = 5;
let nextSubtaskId = 6;

export const tasksApi = {
  // Get all tasks
  getTasks: async (projectId?: number): Promise<Task[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (projectId !== undefined) {
      return tasks.filter(t => t.project_id === projectId);
    }
    return [...tasks];
  },

  // Get single task
  getTask: async (id: number): Promise<Task | null> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return tasks.find(t => t.id === id) || null;
  },

  // Create task
  createTask: async (data: CreateTaskRequest): Promise<Task> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const task: Task = {
      id: nextTaskId++,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      subtasks: []
    };
    tasks.push(task);
    return task;
  },

  // Update task
  updateTask: async (id: number, data: Partial<CreateTaskRequest>): Promise<Task | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;

    tasks[index] = {
      ...tasks[index],
      ...data,
      updated_at: new Date().toISOString()
    };
    return tasks[index];
  },

  // Delete task
  deleteTask: async (id: number): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return false;
    tasks.splice(index, 1);
    return true;
  },

  // Add subtask
  addSubtask: async (taskId: number, title: string): Promise<Subtask | null> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;

    const subtask: Subtask = {
      id: nextSubtaskId++,
      task_id: taskId,
      title,
      completed: false,
      created_at: new Date().toISOString()
    };
    task.subtasks.push(subtask);
    return subtask;
  },

  // Toggle subtask
  toggleSubtask: async (taskId: number, subtaskId: number): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;

    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (!subtask) return false;

    subtask.completed = !subtask.completed;
    return true;
  },

  // Delete subtask
  deleteSubtask: async (taskId: number, subtaskId: number): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;

    const index = task.subtasks.findIndex(st => st.id === subtaskId);
    if (index === -1) return false;

    task.subtasks.splice(index, 1);
    return true;
  }
};
