import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../../../core/services/ai.service';
import { TaskService } from '../../../../core/services/task.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [FormsModule],
  template: `
    <header class="header">
      <div class="header__main">
        <div class="header__brand">
          <span class="header__icon">✓</span>
          <h1 class="header__title">Task Manager</h1>
          <span class="header__date">{{ today }}</span>
        </div>

        <div class="header__stats">
          <div class="stat stat--todo">
            <span class="stat__value">{{ stats().todo }}</span>
            <span class="stat__label">À faire</span>
          </div>
          <div class="stat stat--progress">
            <span class="stat__value">{{ stats().inProgress }}</span>
            <span class="stat__label">En cours</span>
          </div>
          <div class="stat stat--done">
            <span class="stat__value">{{ stats().done }}</span>
            <span class="stat__label">Terminé</span>
          </div>
          @if (stats().urgent > 0) {
            <div class="stat stat--urgent">
              <span class="stat__value">{{ stats().urgent }}</span>
              <span class="stat__label">Urgents</span>
            </div>
          }
        </div>

        <div class="header__actions">
          <button
            type="button"
            class="header__ai-toggle"
            (click)="toggleInsights()"
            [attr.aria-expanded]="insightsOpen()"
          >
            Aperçu de la semaine (IA)
          </button>
          <div class="header__search">
            <input
              type="search"
              placeholder="Rechercher une tâche..."
              [ngModel]="search()"
              (ngModelChange)="onSearch($event)"
              class="search-input"
            />
          </div>
        </div>
      </div>

      @if (insightsOpen()) {
        <div class="header__insights" role="region" aria-label="Conseils IA sur vos tâches">
          <div class="header__insights-toolbar">
            <button
              type="button"
              class="header__ai-run"
              (click)="loadInsights()"
              [disabled]="ai.insightsLoading()"
            >
              {{ ai.insightsLoading() ? 'Analyse en cours…' : 'Générer les conseils' }}
            </button>
            <button type="button" class="header__ai-close" (click)="closeInsights()">Fermer</button>
          </div>
          @if (ai.insightsError(); as err) {
            <p class="header__insights-error">{{ err }}</p>
          }
          @if (ai.lastInsights(); as sections) {
            <div class="header__insights-body">
              @for (s of sections; track $index) {
                <article class="insight-card">
                  <h3 class="insight-card__title">{{ s.heading }}</h3>
                  <p class="insight-card__text">{{ s.body }}</p>
                </article>
              }
            </div>
          }
        </div>
      }
    </header>
  `,
  styleUrl: './header.scss'
})
export class HeaderComponent {
  private readonly taskService = inject(TaskService);
  readonly ai = inject(AiService);
  readonly stats = this.taskService.stats;
  readonly search = signal('');
  readonly insightsOpen = signal(false);

  readonly today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  onSearch(value: string): void {
    this.search.set(value);
    this.taskService.setFilter({ search: value });
  }

  toggleInsights(): void {
    this.insightsOpen.update((v) => !v);
  }

  closeInsights(): void {
    this.insightsOpen.set(false);
  }

  loadInsights(): void {
    void this.ai.fetchWeekInsights(this.taskService.allTasks());
  }
}
