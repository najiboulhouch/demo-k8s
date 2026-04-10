import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Task, TaskCategory, TaskPriority, TaskStatus } from '../../../../core/models/task.model';
import { TaskService } from '../../../../core/services/task.service';
import { TaskItemComponent } from '../task-item/task-item';
import { TaskFormComponent } from '../task-form/task-form';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [FormsModule, TaskItemComponent, TaskFormComponent],
  template: `
    <div class="task-list-page">
      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar__filters">
          <select class="filter-select" (change)="onStatusFilter($event)">
            <option value="all">Tous les statuts</option>
            <option value="todo">À faire</option>
            <option value="in-progress">En cours</option>
            <option value="done">Terminé</option>
          </select>

          <select class="filter-select" (change)="onPriorityFilter($event)">
            <option value="all">Toutes priorités</option>
            <option value="urgent">Urgente</option>
            <option value="high">Haute</option>
            <option value="medium">Moyenne</option>
            <option value="low">Faible</option>
          </select>

          <select class="filter-select" (change)="onCategoryFilter($event)">
            <option value="all">Toutes catégories</option>
            <option value="work">💼 Travail</option>
            <option value="personal">👤 Personnel</option>
            <option value="health">💪 Santé</option>
            <option value="learning">📚 Apprentissage</option>
            <option value="other">📌 Autre</option>
          </select>
        </div>

        <button class="btn btn--primary btn--add" (click)="openForm()">
          + Nouvelle tâche
        </button>
      </div>

      <!-- Liste des tâches -->
      <div class="task-list">
        @if (taskService.filteredTasks().length === 0) {
          <div class="empty-state">
            <span class="empty-state__icon">📋</span>
            <p>Aucune tâche trouvée</p>
            <button class="btn btn--primary" (click)="openForm()">Ajouter une tâche</button>
          </div>
        } @else {
          @for (task of paginatedTasks(); track task.id) {
            <app-task-item [task]="task" (edit)="openEditForm($event)" />
          }
        }
      </div>

      @if (taskService.filteredTasks().length > pageSize()) {
        <nav class="pagination" aria-label="Pagination des tâches">
          <div class="pagination__meta">
            Page {{ page() }} / {{ totalPages() }} · {{ taskService.filteredTasks().length }} tâches
          </div>

          <div class="pagination__controls">
            <button
              type="button"
              class="pagination__btn"
              (click)="prevPage()"
              [disabled]="page() <= 1"
            >
              Précédent
            </button>

            <div class="pagination__pages" role="list">
              @for (p of pages(); track p) {
                <button
                  type="button"
                  class="pagination__page"
                  [class.pagination__page--active]="p === page()"
                  (click)="goToPage(p)"
                  role="listitem"
                >
                  {{ p }}
                </button>
              }
            </div>

            <button
              type="button"
              class="pagination__btn"
              (click)="nextPage()"
              [disabled]="page() >= totalPages()"
            >
              Suivant
            </button>
          </div>
        </nav>
      }
    </div>

    <!-- Modal formulaire -->
    @if (showForm) {
      <app-task-form (close)="closeForm()" #formRef />
    }
  `,
  styleUrl: './task-list.scss'
})
export class TaskListComponent {
  readonly taskService = inject(TaskService);
  showForm = false;

  readonly pageSize = signal(5);
  readonly page = signal(1);

  readonly totalPages = computed(() => {
    const total = this.taskService.filteredTasks().length;
    return Math.max(1, Math.ceil(total / this.pageSize()));
  });

  readonly paginatedTasks = computed(() => {
    const all = this.taskService.filteredTasks();
    const p = Math.min(this.page(), this.totalPages());
    const start = (p - 1) * this.pageSize();
    return all.slice(start, start + this.pageSize());
  });

  readonly pages = computed(() => {
    const total = this.totalPages();
    const current = Math.min(this.page(), total);
    const windowSize = 5;
    const half = Math.floor(windowSize / 2);
    const start = Math.max(1, current - half);
    const end = Math.min(total, start + windowSize - 1);
    const adjustedStart = Math.max(1, end - windowSize + 1);
    const out: number[] = [];
    for (let i = adjustedStart; i <= end; i++) out.push(i);
    return out;
  });

  private readonly formRef = viewChild<TaskFormComponent>('formRef');

  constructor() {
    // Reset to first page when filters or list change
    effect(() => {
      this.taskService.filteredTasks();
      this.page.set(1);
    });

    // Clamp page if list shrinks
    effect(() => {
      const total = this.totalPages();
      if (this.page() > total) {
        this.page.set(total);
      }
    });
  }

  openForm(): void {
    this.showForm = true;
  }

  openEditForm(task: Task): void {
    this.showForm = true;
    // Defer to next tick so formRef is available
    setTimeout(() => this.formRef()?.initEdit(task));
  }

  closeForm(): void {
    this.showForm = false;
  }

  onStatusFilter(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as TaskStatus | 'all';
    this.taskService.setFilter({ status: value });
  }

  onPriorityFilter(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as TaskPriority | 'all';
    this.taskService.setFilter({ priority: value });
  }

  onCategoryFilter(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as TaskCategory | 'all';
    this.taskService.setFilter({ category: value });
  }

  goToPage(p: number): void {
    const clamped = Math.max(1, Math.min(p, this.totalPages()));
    this.page.set(clamped);
  }

  prevPage(): void {
    this.goToPage(this.page() - 1);
  }

  nextPage(): void {
    this.goToPage(this.page() + 1);
  }
}
