import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Task, TaskFilter, TaskPriority, TaskStatus, TaskCategory } from '../models/task.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly tasks = signal<Task[]>([]);
  readonly filter = signal<TaskFilter>({ status: 'all', priority: 'all', category: 'all', search: '' });

  /** Liste complète (hors filtres), utile pour l’export vers l’IA. */
  readonly allTasks = computed(() => this.tasks());

  readonly filteredTasks = computed(() => {
    const { status, priority, category, search } = this.filter();
    return this.tasks().filter(task => {
      const matchStatus = !status || status === 'all' || task.status === status;
      const matchPriority = !priority || priority === 'all' || task.priority === priority;
      const matchCategory = !category || category === 'all' || task.category === category;
      const matchSearch = !search || task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchPriority && matchCategory && matchSearch;
    });
  });

  readonly stats = computed(() => {
    const all = this.tasks();
    return {
      total: all.length,
      todo: all.filter(t => t.status === 'todo').length,
      inProgress: all.filter(t => t.status === 'in-progress').length,
      done: all.filter(t => t.status === 'done').length,
      urgent: all.filter(t => t.priority === 'urgent' && t.status !== 'done').length,
    };
  });

  constructor() {
    void this.refreshFromServer();
  }

  async refreshFromServer(): Promise<void> {
    try {
      const tasks = await firstValueFrom(this.http.get<Task[]>(this.url('/api/tasks')));
      this.tasks.set(tasks ?? []);
    } catch {
      // If API is down, keep current in-memory state (empty by default).
    }
  }

  async addTask(data: Omit<Task, 'id' | 'createdAt'>): Promise<void> {
    await firstValueFrom(this.http.post<Task>(this.url('/api/tasks'), data));
    await this.refreshFromServer();
  }

  async updateTask(id: string, changes: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<void> {
    await firstValueFrom(this.http.patch<Task>(this.url(`/api/tasks/${id}`), changes));
    await this.refreshFromServer();
  }

  async deleteTask(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<unknown>(this.url(`/api/tasks/${id}`)));
    await this.refreshFromServer();
  }

  async toggleStatus(id: string): Promise<void> {
    const task = this.tasks().find(t => t.id === id);
    if (!task) return;

    const next: Record<TaskStatus, TaskStatus> = {
      'todo': 'in-progress',
      'in-progress': 'done',
      'done': 'todo',
    };
    const newStatus = next[task.status];
    await this.updateTask(id, {
      status: newStatus,
      completedAt: newStatus === 'done' ? new Date().toISOString() : undefined,
    });
  }

  setFilter(patch: Partial<TaskFilter>): void {
    this.filter.update(f => ({ ...f, ...patch }));
  }

  private url(path: string): string {
    const base = environment.apiBaseUrl.replace(/\/$/, '');
    return `${base}${path}`;
  }
}
