export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskCategory = 'work' | 'personal' | 'health' | 'learning' | 'other';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  dueTime?: string; // HH:mm
  createdAt: string; // ISO date
  completedAt?: string; // ISO date
}

export interface TaskFilter {
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  category?: TaskCategory | 'all';
  search?: string;
}
