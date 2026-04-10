import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="confirm-overlay" (click)="cancel.emit()">
      <div class="confirm-dialog" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
        <div class="confirm-dialog__icon">🗑️</div>
        <h3 class="confirm-dialog__title">Supprimer la tâche ?</h3>
        <p class="confirm-dialog__message">
          <strong>« {{ taskTitle() }} »</strong> sera supprimée définitivement.
        </p>
        <div class="confirm-dialog__actions">
          <button class="btn btn--ghost" (click)="cancel.emit()">Annuler</button>
          <button class="btn btn--danger" (click)="confirm.emit()" cdkFocusInitial>Supprimer</button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialogComponent {
  readonly taskTitle = input.required<string>();
  readonly confirm = output<void>();
  readonly cancel = output<void>();
}
