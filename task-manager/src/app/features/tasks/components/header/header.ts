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
            (click)="toggleRag()"
            [attr.aria-expanded]="ragOpen()"
          >
            Assistant RAG
          </button>
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

      @if (ragOpen()) {
        <div class="header__rag" role="region" aria-label="Assistant RAG sur le corpus projet">
          <p class="header__rag-hint">
            Corpus <code>rag/corpus/</code> ; recherche <strong>lexicale</strong> ou par <strong>embeddings</strong> si
            <code>data/rag-embeddings.json</code> existe (<code>npm run rag:index</code>).
          </p>
          <label class="header__rag-check">
            <input type="checkbox" [(ngModel)]="ragIncludeTasks" />
            Inclure les tâches (<code>data/db.json</code>) dans le contexte (hybride)
          </label>
          <div class="header__rag-row">
            <textarea
              class="header__rag-input"
              rows="2"
              placeholder="Ex. : Où sont stockées les tâches ?"
              [(ngModel)]="ragQuestion"
            ></textarea>
            <button
              type="button"
              class="header__ai-run"
              (click)="runRag()"
              [disabled]="ai.ragLoading() || !ragQuestion.trim()"
            >
              {{ ai.ragLoading() ? 'Réponse…' : 'Demander' }}
            </button>
            <button type="button" class="header__ai-close" (click)="closeRag()">Fermer</button>
          </div>
          @if (ai.ragError(); as rErr) {
            <p class="header__insights-error">{{ rErr }}</p>
          }
          @if (ai.lastRagMeta(); as meta) {
            <p class="header__rag-meta">
              Récupération : {{ meta.retrievalMethod === 'embedding' ? 'embeddings' : 'lexicale' }}
              @if (meta.includeTasks) {
                <span> · tâches incluses</span>
              }
            </p>
          }
          @if (ai.lastRagAnswer(); as ans) {
            <div class="header__rag-answer">
              <h3 class="header__rag-answer-title">Réponse</h3>
              <p class="header__rag-answer-text">{{ ans }}</p>
            </div>
          }
          @if (ai.lastRagCitations(); as cites) {
            @if (cites.length > 0) {
              <div class="header__rag-cites">
                <h4 class="header__rag-subtitle">Citations (modèle)</h4>
                <ul class="header__rag-cite-list">
                  @for (c of cites; track $index) {
                    <li>
                      <span class="header__rag-src">{{ c.source }}</span>
                      <span class="header__rag-ex">{{ c.excerpt }}</span>
                    </li>
                  }
                </ul>
              </div>
            }
          }
          @if (ai.lastRagRetrieved(); as ret) {
            @if (ret.length > 0) {
              <div class="header__rag-retrieved">
                <h4 class="header__rag-subtitle">Passages retrouvés (recherche)</h4>
                <ul class="header__rag-cite-list">
                  @for (r of ret; track $index) {
                    <li>
                      <span class="header__rag-src">{{ r.source }}</span>
                      <span class="header__rag-ex">{{ r.excerpt }}</span>
                    </li>
                  }
                </ul>
              </div>
            }
          }
        </div>
      }

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
  readonly ragOpen = signal(false);
  ragQuestion = '';
  ragIncludeTasks = false;

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

  toggleRag(): void {
    this.ragOpen.update((v) => !v);
  }

  closeRag(): void {
    this.ragOpen.set(false);
  }

  runRag(): void {
    const q = this.ragQuestion.trim();
    if (!q) return;
    void this.ai.ragAsk(q, 4, this.ragIncludeTasks);
  }

  loadInsights(): void {
    void this.ai.fetchWeekInsights(this.taskService.allTasks());
  }
}
