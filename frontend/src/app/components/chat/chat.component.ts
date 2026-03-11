import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ChatMessage } from '../../models/models';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-page">
      <div class="chat-container">
        <!-- Header -->
        <div class="chat-header">
          <div class="chat-avatar">
            <span>🤖</span>
            <div class="status-dot"></div>
          </div>
          <div class="chat-meta">
            <div class="chat-name">FinCoach IA</div>
            <div class="chat-status">Assistant financier personnel · En ligne</div>
          </div>
          <button class="btn-ghost btn-clear" (click)="clearHistory()" title="Effacer la conversation">
            🗑 Effacer
          </button>
        </div>

        <!-- Messages -->
        <div class="messages-area" #messagesEnd>
          <!-- Welcome message -->
          <div class="message message-assistant animate-in" *ngIf="messages.length === 0 && !loading">
            <div class="msg-avatar">🤖</div>
            <div class="msg-bubble">
              <div class="msg-content">
                <p>Bonjour ! Je suis <strong>FinCoach</strong>, votre assistant financier personnel.</p>
                <p>Je peux vous aider sur :</p>
                <div class="suggestions">
                  <button class="suggestion-chip" *ngFor="let s of suggestions" (click)="sendSuggestion(s)">
                    {{ s }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <ng-container *ngFor="let msg of messages; let i = index">
            <div class="message" [class.message-user]="msg.role === 'user'" [class.message-assistant]="msg.role === 'assistant'"
                 [style.animation-delay]="0.05 + 's'">

              <div class="msg-avatar" *ngIf="msg.role === 'assistant'">🤖</div>

              <div class="msg-bubble">
                <div class="msg-content" [innerHTML]="formatMessage(msg.content)"></div>
                <div class="msg-time">{{ msg.createdAt | date:'HH:mm' }}</div>
              </div>

              <div class="msg-avatar user-av" *ngIf="msg.role === 'user'">U</div>
            </div>
          </ng-container>

          <!-- Typing indicator -->
          <div class="message message-assistant" *ngIf="typing">
            <div class="msg-avatar">🤖</div>
            <div class="msg-bubble typing-bubble">
              <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>
          </div>
        </div>

        <!-- Quick suggestions -->
        <div class="quick-suggestions" *ngIf="messages.length > 0">
          <button class="suggestion-chip sm" *ngFor="let s of quickSuggestions" (click)="sendSuggestion(s)">
            {{ s }}
          </button>
        </div>

        <!-- Input area -->
        <div class="chat-input-area">
          <textarea
            [(ngModel)]="inputMessage"
            (keydown.enter)="onEnter($event)"
            placeholder="Posez votre question financière... (Entrée pour envoyer)"
            rows="2"
            [disabled]="typing"
            class="chat-input"
          ></textarea>
          <button class="send-btn" (click)="sendMessage()" [disabled]="!inputMessage.trim() || typing">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>

        <div class="chat-disclaimer">
          FinCoach donne des conseils à titre informatif. Pour des décisions importantes, consultez un conseiller financier agréé.
        </div>
      </div>

      <!-- Side panel: topics -->
      <div class="chat-sidebar">
        <h3>💡 Sujets populaires</h3>
        <div class="topic-list">
          <div class="topic-card" *ngFor="let topic of topics" (click)="sendSuggestion(topic.q)">
            <span class="topic-icon">{{ topic.icon }}</span>
            <div>
              <div class="topic-title">{{ topic.title }}</div>
              <div class="topic-q">{{ topic.q }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-page {
      height: 100vh;
      display: flex;
      gap: 0;
    }

    .chat-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--border);
      min-width: 0;
    }

    .chat-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px 24px;
      border-bottom: 1px solid var(--border);
      background: var(--bg-card);
      flex-shrink: 0;
    }

    .chat-avatar {
      width: 44px; height: 44px;
      background: var(--gold-bg);
      border: 1px solid var(--gold-dim);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      position: relative;

      .status-dot {
        width: 10px; height: 10px;
        background: var(--green);
        border-radius: 50%;
        border: 2px solid var(--bg-card);
        position: absolute;
        bottom: -2px;
        right: -2px;
        animation: pulse-gold 2s infinite;
      }
    }

    .chat-meta {
      flex: 1;
      .chat-name   { font-family: var(--font-display); font-weight: 700; font-size: 16px; }
      .chat-status { font-size: 12px; color: var(--green); margin-top: 2px; }
    }

    .btn-clear { font-size: 12px; padding: 6px 12px; }

    .messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .message {
      display: flex;
      gap: 12px;
      align-items: flex-end;
      animation: fadeInUp 0.3s ease both;

      &.message-user {
        flex-direction: row-reverse;
        .msg-bubble { background: var(--gold-bg); border: 1px solid var(--gold-dim); border-radius: 18px 4px 18px 18px; }
      }

      &.message-assistant {
        .msg-bubble { background: var(--bg-card); border: 1px solid var(--border); border-radius: 4px 18px 18px 18px; }
      }
    }

    .msg-avatar {
      width: 36px; height: 36px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }

    .user-av {
      background: var(--gold-bg);
      border-color: var(--gold-dim);
      color: var(--gold);
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 13px;
    }

    .msg-bubble {
      max-width: 65%;
      padding: 14px 16px;
      position: relative;
    }

    .msg-content {
      font-size: 14px;
      line-height: 1.6;
      color: var(--text-primary);

      p { margin-bottom: 8px; &:last-child { margin-bottom: 0; } }
      strong { color: var(--gold); }

      :deep(.bold-text) { color: var(--gold-light); font-weight: 700; }
    }

    .msg-time {
      font-size: 10px;
      color: var(--text-muted);
      margin-top: 6px;
      text-align: right;
    }

    .suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    .suggestion-chip {
      background: var(--gold-bg);
      border: 1px solid var(--gold-dim);
      color: var(--gold);
      font-size: 12px;
      font-weight: 500;
      padding: 6px 12px;
      border-radius: 100px;
      transition: all 0.15s;
      cursor: pointer;

      &:hover { background: rgba(201,168,76,0.2); }
      &.sm { font-size: 11px; padding: 4px 10px; }
    }

    .typing-bubble {
      display: flex;
      gap: 5px;
      align-items: center;
      padding: 16px 20px;

      .dot {
        width: 8px; height: 8px;
        background: var(--gold-dim);
        border-radius: 50%;
        animation: bounce 1.4s infinite ease-in-out;
        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.4s; }
      }
    }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }

    .quick-suggestions {
      padding: 10px 24px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      border-top: 1px solid var(--border);
      background: var(--bg-card);
    }

    .chat-input-area {
      display: flex;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid var(--border);
      background: var(--bg-card);
      align-items: flex-end;
    }

    .chat-input {
      flex: 1;
      resize: none;
      border-radius: var(--radius);
      font-size: 14px;
      min-height: 44px;
      max-height: 120px;
    }

    .send-btn {
      width: 44px; height: 44px;
      background: var(--gold);
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--bg-base);
      transition: all 0.15s;
      flex-shrink: 0;

      &:hover:not(:disabled) { background: var(--gold-light); transform: scale(1.05); }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }

    .chat-disclaimer {
      padding: 8px 24px;
      font-size: 11px;
      color: var(--text-muted);
      background: var(--bg-card);
      text-align: center;
    }

    // Side panel
    .chat-sidebar {
      width: 280px;
      flex-shrink: 0;
      padding: 24px;
      overflow-y: auto;

      h3 { font-size: 14px; font-weight: 700; margin-bottom: 16px; color: var(--text-secondary); }
    }

    .topic-list { display: flex; flex-direction: column; gap: 10px; }

    .topic-card {
      display: flex;
      gap: 12px;
      padding: 12px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      cursor: pointer;
      transition: all 0.15s;

      &:hover { border-color: var(--gold-dim); background: var(--gold-bg); }

      .topic-icon  { font-size: 20px; flex-shrink: 0; }
      .topic-title { font-size: 13px; font-weight: 600; margin-bottom: 3px; }
      .topic-q     { font-size: 11px; color: var(--text-muted); }
    }
  `]
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesEnd') private messagesEnd!: ElementRef;

  messages: ChatMessage[] = [];
  loading = false;
  typing = false;
  inputMessage = '';

  suggestions = [
    'Comment établir un budget ?',
    'Comment rembourser mes dettes ?',
    'Conseils pour épargner',
    'Où investir en France ?'
  ];

  quickSuggestions = [
    'Comment économiser ?',
    'Méthode boule de neige',
    'Livret A ou PEL ?',
    'Règle 50/30/20'
  ];

  topics = [
    { icon: '📊', title: 'Budget & Dépenses', q: 'Comment établir un budget mensuel efficace ?' },
    { icon: '💳', title: 'Gestion des dettes', q: 'Quelle est la meilleure stratégie pour rembourser mes dettes ?' },
    { icon: '🏦', title: 'Épargne', q: 'Combien devrais-je épargner chaque mois ?' },
    { icon: '📈', title: 'Investissement', q: 'Par où commencer pour investir en France ?' },
    { icon: '🏠', title: 'Immobilier', q: 'Vaut-il mieux louer ou acheter sa résidence principale ?' },
    { icon: '🎯', title: 'Objectifs', q: 'Comment me constituer un fonds d\'urgence rapidement ?' },
    { icon: '📉', title: 'Réduire ses charges', q: 'Comment réduire mes dépenses fixes ce mois-ci ?' },
    { icon: '🌅', title: 'Retraite', q: 'À quel âge commencer à épargner pour la retraite ?' },
  ];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loading = true;
    this.api.getChatHistory().subscribe({
      next: msgs => { this.messages = msgs; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  ngAfterViewChecked() { this.scrollToBottom(); }

  private scrollToBottom() {
    try {
      const el = this.messagesEnd.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }

  sendMessage() {
    const text = this.inputMessage.trim();
    if (!text || this.typing) return;

    const userMsg: ChatMessage = { userId: 'user-demo', role: 'user', content: text, createdAt: new Date().toISOString() };
    this.messages.push(userMsg);
    this.inputMessage = '';
    this.typing = true;

    this.api.sendMessage(text).subscribe({
      next: reply => { this.messages.push(reply); this.typing = false; },
      error: () => {
        this.messages.push({ userId: 'user-demo', role: 'assistant', content: 'Une erreur est survenue. Vérifiez que le backend est démarré.', createdAt: new Date().toISOString() });
        this.typing = false;
      }
    });
  }

  sendSuggestion(text: string) {
    this.inputMessage = text;
    this.sendMessage();
  }

  onEnter(event: Event) {
    const e = event as KeyboardEvent;
    if (!e.shiftKey) { e.preventDefault(); this.sendMessage(); }
  }

  clearHistory() {
    if (confirm('Effacer tout l\'historique ?')) {
      this.api.clearChat().subscribe(() => { this.messages = []; });
    }
  }

  formatMessage(content: string): string {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<span class="bold-text">$1</span>')
      .replace(/\n/g, '<br>');
  }
}
