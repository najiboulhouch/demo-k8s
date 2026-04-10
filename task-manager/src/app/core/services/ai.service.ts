import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task } from '../models/task.model';

export interface SuggestSubtasksResponse {
  subtasks: { title: string }[];
}

export interface WeekInsightSection {
  heading: string;
  body: string;
}

export interface WeekInsightsResponse {
  sections: WeekInsightSection[];
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly http = inject(HttpClient);

  readonly subtasksLoading = signal(false);
  readonly subtasksError = signal<string | null>(null);
  readonly lastSubtasks = signal<{ title: string }[] | null>(null);

  readonly insightsLoading = signal(false);
  readonly insightsError = signal<string | null>(null);
  readonly lastInsights = signal<WeekInsightSection[] | null>(null);

  clearSubtasksState(): void {
    this.lastSubtasks.set(null);
    this.subtasksError.set(null);
  }

  clearInsightsState(): void {
    this.lastInsights.set(null);
    this.insightsError.set(null);
  }

  async suggestSubtasks(title: string, description?: string): Promise<void> {
    this.subtasksLoading.set(true);
    this.subtasksError.set(null);
    this.lastSubtasks.set(null);
    try {
      const res = await firstValueFrom(
        this.http.post<SuggestSubtasksResponse>(this.url('/api/ai/suggest-subtasks'), {
          title,
          description: description?.trim() || undefined,
        }),
      );
      this.lastSubtasks.set(res.subtasks ?? []);
    } catch (e: unknown) {
      this.subtasksError.set(this.mapHttpError(e));
    } finally {
      this.subtasksLoading.set(false);
    }
  }

  async fetchWeekInsights(tasks: Task[]): Promise<void> {
    this.insightsLoading.set(true);
    this.insightsError.set(null);
    this.lastInsights.set(null);
    const payload = {
      tasks: tasks.map((t) => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        category: t.category,
        dueTime: t.dueTime,
      })),
    };
    try {
      const res = await firstValueFrom(
        this.http.post<WeekInsightsResponse>(this.url('/api/ai/week-insights'), payload),
      );
      this.lastInsights.set(res.sections ?? []);
    } catch (e: unknown) {
      this.insightsError.set(this.mapHttpError(e));
    } finally {
      this.insightsLoading.set(false);
    }
  }

  private url(path: string): string {
    const base = environment.apiBaseUrl.replace(/\/$/, '');
    return `${base}${path}`;
  }

  private mapHttpError(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      const body = e.error;
      if (body && typeof body === 'object' && 'error' in body) {
        const msg = (body as { error: unknown }).error;
        if (typeof msg === 'string' && msg.trim()) {
          return msg;
        }
      }
      if (e.status === 0) {
        return 'Impossible de joindre l’API. Vérifiez que le serveur tourne (npm run dev dans task-manager-api).';
      }
      return e.message || 'Erreur réseau.';
    }
    if (e instanceof Error) {
      return e.message;
    }
    return 'Une erreur inattendue s’est produite.';
  }
}
