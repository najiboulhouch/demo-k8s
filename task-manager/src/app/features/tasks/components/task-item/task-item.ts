import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { Task } from '../../../../core/models/task.model';
import { TaskService } from '../../../../core/services/task.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-task-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ConfirmDialogComponent],
  template: `
    <div class="task-item"
         [class.task-item--done]="task().status === 'done'"
         [attr.data-priority]="task().priority"
         [attr.data-status]="task().status">

      <button class="task-item__status-btn"
              (click)="taskService.toggleStatus(task().id)"
              [title]="statusLabel()">
        <span class="status-icon">{{ statusIcon() }}</span>
      </button>

      <div class="task-item__body">
        <div class="task-item__top">
          <span class="task-item__title">{{ task().title }}</span>
          <div class="task-item__badges">
            <span class="badge badge--priority" [attr.data-priority]="task().priority">
              {{ priorityLabel() }}
            </span>
            <span class="badge badge--category" [attr.data-category]="task().category">
              {{ categoryIcon() }} {{ categoryLabel() }}
            </span>
            @if (task().dueTime) {
              <span class="badge badge--time" [class.badge--overdue]="isOverdue()">
                ⏰ {{ task().dueTime }}
              </span>
            }
          </div>
        </div>
        @if (task().description) {
          <p class="task-item__description">{{ task().description }}</p>
        }
      </div>

      <div class="task-item__actions">
        <button class="btn-icon btn-icon--edit" (click)="edit.emit(task())" title="Modifier">✏️</button>
        <button class="btn-icon btn-icon--delete" (click)="showConfirm.set(true)" title="Supprimer">🗑️</button>
      </div>
    </div>

    @if (showConfirm()) {
      <app-confirm-dialog
        [taskTitle]="task().title"
        (confirm)="confirmDelete()"
        (cancel)="showConfirm.set(false)" />
    }
  `,
  styleUrl: './task-item.scss'
})
export class TaskItemComponent {
  readonly task = input.required<Task>();
  readonly edit = output<Task>();

  readonly taskService = inject(TaskService);
  readonly showConfirm = signal(false);

  statusIcon(): string {
    const icons: Record<string, string> = {
      'todo': '○',
      'in-progress': '◑',
      'done': '●',
    };
    return icons[this.task().status];
  }

  statusLabel(): string {
    const labels: Record<string, string> = {
      'todo': 'Marquer en cours',
      'in-progress': 'Marquer terminé',
      'done': 'Remettre à faire',
    };
    return labels[this.task().status];
  }

  priorityLabel(): string {
    const labels: Record<string, string> = {
      low: 'Faible', medium: 'Moyenne', high: 'Haute', urgent: 'Urgente'
    };
    return labels[this.task().priority];
  }

  categoryIcon(): string {
    const icons: Record<string, string> = {
      work: '💼', personal: '👤', health: '💪', learning: '📚', other: '📌'
    };
    return icons[this.task().category];
  }

  categoryLabel(): string {
    const labels: Record<string, string> = {
      work: 'Travail', personal: 'Personnel', health: 'Santé',
      learning: 'Apprentissage', other: 'Autre'
    };
    return labels[this.task().category];
  }

  isOverdue(): boolean {
    if (!this.task().dueTime || this.task().status === 'done') return false;
    const now = new Date();
    const [h, m] = this.task().dueTime!.split(':').map(Number);
    return now.getHours() * 60 + now.getMinutes() > h * 60 + m;
  }

  confirmDelete(): void {
    void this.taskService.deleteTask(this.task().id);
    this.showConfirm.set(false);
  }
}
