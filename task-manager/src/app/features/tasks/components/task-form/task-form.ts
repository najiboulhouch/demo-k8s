import { Component, inject, OnInit, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Task, TaskCategory, TaskPriority } from '../../../../core/models/task.model';
import { AiService } from '../../../../core/services/ai.service';
import { TaskService } from '../../../../core/services/task.service';

interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  category: TaskCategory;
  dueTime: string;
}

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="form-overlay" (click)="onOverlayClick($event)">
      <div class="form-card">
        <div class="form-card__header">
          <h2>{{ editTask ? 'Modifier la tâche' : 'Nouvelle tâche' }}</h2>
          <button class="btn-icon" (click)="close.emit()" aria-label="Fermer">✕</button>
        </div>

        <form class="task-form" (ngSubmit)="onSubmit()" #f="ngForm">
          <div class="form-group">
            <label for="title">Titre *</label>
            <input
              id="title"
              name="title"
              type="text"
              [(ngModel)]="formData.title"
              required
              placeholder="Que devez-vous faire ?"
              class="form-control"
              autofocus
            />
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea
              id="description"
              name="description"
              [(ngModel)]="formData.description"
              placeholder="Détails optionnels..."
              class="form-control"
              rows="3"
            ></textarea>
          </div>

          <div class="ai-block">
            <button
              type="button"
              class="btn btn--secondary btn--ai"
              (click)="onSuggestSubtasks()"
              [disabled]="!formData.title.trim() || aiService.subtasksLoading()"
            >
              {{ aiService.subtasksLoading() ? 'Génération des sous-tâches…' : 'Suggérer des sous-tâches (IA)' }}
            </button>
            @if (aiService.subtasksError(); as subErr) {
              <p class="ai-block__error">{{ subErr }}</p>
            }
            @if (aiService.lastSubtasks(); as subs) {
              <ul class="ai-block__list">
                @for (s of subs; track $index) {
                  <li>{{ s.title }}</li>
                }
              </ul>
              <button
                type="button"
                class="btn btn--primary btn--ai-add"
                (click)="addSuggestedSubtasks()"
              >
                Ajouter ces sous-tâches
              </button>
            }
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="priority">Priorité</label>
              <select id="priority" name="priority" [(ngModel)]="formData.priority" class="form-control">
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div class="form-group">
              <label for="category">Catégorie</label>
              <select id="category" name="category" [(ngModel)]="formData.category" class="form-control">
                <option value="work">Travail</option>
                <option value="personal">Personnel</option>
                <option value="health">Santé</option>
                <option value="learning">Apprentissage</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div class="form-group">
              <label for="dueTime">Heure limite</label>
              <input
                id="dueTime"
                name="dueTime"
                type="time"
                [(ngModel)]="formData.dueTime"
                class="form-control"
              />
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn--secondary" (click)="close.emit()">Annuler</button>
            <button type="submit" class="btn btn--primary" [disabled]="!formData.title.trim()">
              {{ editTask ? 'Enregistrer' : 'Ajouter la tâche' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrl: './task-form.scss'
})
export class TaskFormComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  readonly aiService = inject(AiService);

  readonly close = output<void>();
  editTask: Task | null = null;

  formData: TaskFormData = {
    title: '',
    description: '',
    priority: 'medium',
    category: 'work',
    dueTime: '',
  };

  ngOnInit(): void {
    this.aiService.clearSubtasksState();
  }

  initEdit(task: Task): void {
    this.editTask = task;
    this.formData = {
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      category: task.category,
      dueTime: task.dueTime ?? '',
    };
    this.aiService.clearSubtasksState();
  }

  onSuggestSubtasks(): void {
    const title = this.formData.title.trim();
    if (!title) return;
    void this.aiService.suggestSubtasks(title, this.formData.description);
  }

  addSuggestedSubtasks(): void {
    const subs = this.aiService.lastSubtasks();
    if (!subs?.length) return;
    const due = this.formData.dueTime || undefined;
    for (const s of subs) {
      const t = s.title.trim();
      if (!t) continue;
      void this.taskService.addTask({
        title: t,
        description: undefined,
        priority: this.formData.priority,
        category: this.formData.category,
        status: 'todo',
        dueTime: due,
      });
    }
    this.aiService.clearSubtasksState();
  }

  onSubmit(): void {
    if (!this.formData.title.trim()) return;

    const payload = {
      title: this.formData.title.trim(),
      description: this.formData.description.trim() || undefined,
      priority: this.formData.priority,
      category: this.formData.category,
      status: this.editTask?.status ?? 'todo' as const,
      dueTime: this.formData.dueTime || undefined,
    };

    if (this.editTask) {
      void this.taskService.updateTask(this.editTask.id, payload);
    } else {
      void this.taskService.addTask(payload);
    }

    this.close.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('form-overlay')) {
      this.close.emit();
    }
  }
}
