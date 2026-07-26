import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../api.service";
import { AuthService } from "../auth/auth.service";
import { ChatMessage } from "../../shared/models/chat-message.model";

@Component({
  selector: "app-chat",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.scss"],
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild("messagesEnd") private messagesEnd!: ElementRef;

  messages: ChatMessage[] = [];
  loading = false;
  typing = false;
  inputMessage = "";

  /** Nombre d'éléments affichés au dernier scroll auto — évite de voler le
   *  scroll de l'utilisateur à chaque cycle de détection de changements. */
  private lastRenderedCount = -1;

  suggestions = [
    "Comment établir un budget ?",
    "Comment rembourser mes dettes ?",
    "Conseils pour épargner",
    "Où investir en France ?",
  ];

  quickSuggestions = [
    "Comment économiser ?",
    "Méthode boule de neige",
    "Livret A ou PEL ?",
    "Règle 50/30/20",
  ];

  topics = [
    {
      icon: "📊",
      title: "Budget & Dépenses",
      q: "Comment établir un budget mensuel efficace ?",
    },
    {
      icon: "💳",
      title: "Gestion des dettes",
      q: "Quelle est la meilleure stratégie pour rembourser mes dettes ?",
    },
    {
      icon: "🏦",
      title: "Épargne",
      q: "Combien devrais-je épargner chaque mois ?",
    },
    {
      icon: "📈",
      title: "Investissement",
      q: "Par où commencer pour investir en France ?",
    },
    {
      icon: "🏠",
      title: "Immobilier",
      q: "Vaut-il mieux louer ou acheter sa résidence principale ?",
    },
    {
      icon: "🎯",
      title: "Objectifs",
      q: "Comment me constituer un fonds d'urgence rapidement ?",
    },
    {
      icon: "📉",
      title: "Réduire ses charges",
      q: "Comment réduire mes dépenses fixes ce mois-ci ?",
    },
    {
      icon: "🌅",
      title: "Retraite",
      q: "À quel âge commencer à épargner pour la retraite ?",
    },
  ];

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit() {
    this.loading = true;
    this.api.chat.getChatHistory().subscribe({
      next: (msgs) => {
        this.messages = msgs;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  ngAfterViewChecked() {
    // Ne scrolle que lorsqu'un message (ou l'indicateur de frappe) est ajouté,
    // pas à chaque cycle — sinon impossible de relire le haut de la conversation.
    const count = this.messages.length + (this.typing ? 1 : 0);
    if (count !== this.lastRenderedCount) {
      this.lastRenderedCount = count;
      this.scrollToBottom();
    }
  }

  private scrollToBottom() {
    try {
      const el = this.messagesEnd.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }

  sendMessage() {
    const text = this.inputMessage.trim();
    if (!text || this.typing) return;

    const userMsg: ChatMessage = {
      userId: this.auth.getCurrentUserId(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    this.messages.push(userMsg);
    this.inputMessage = "";
    this.typing = true;

    this.api.chat.sendMessage(text).subscribe({
      next: (reply) => {
        this.messages.push(reply);
        this.typing = false;
      },
      error: () => {
        this.messages.push({
          userId: this.auth.getCurrentUserId(),
          role: "assistant",
          content:
            "Une erreur est survenue. Vérifiez que le backend est démarré.",
          createdAt: new Date().toISOString(),
        });
        this.typing = false;
      },
    });
  }

  sendSuggestion(text: string) {
    this.inputMessage = text;
    this.sendMessage();
  }

  onEnter(event: Event) {
    const e = event as KeyboardEvent;
    if (!e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  clearHistory() {
    if (confirm("Effacer tout l'historique ?")) {
      this.api.chat.clearChat().subscribe(() => {
        this.messages = [];
      });
    }
  }

  /** Initiale du prénom de l'utilisateur pour l'avatar des messages. */
  get userInitial(): string {
    return this.auth.getCurrentUser()?.name?.charAt(0)?.toUpperCase() ?? "U";
  }

  formatMessage(content: string): string {
    // Échappe le HTML avant la mise en forme : le contenu (utilisateur ou IA)
    // doit s'afficher littéralement, jamais être interprété comme du HTML.
    return this.escapeHtml(content)
      .replace(/\*\*(.*?)\*\*/g, '<span class="bold-text">$1</span>')
      .replace(/\n/g, "<br>");
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
