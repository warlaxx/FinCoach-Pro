import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../services/api.service";
import { AuthService } from "../../services/auth.service";
import { ChatMessage } from "src/app/models/chat-message.model";

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
    this.scrollToBottom();
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

  formatMessage(content: string): string {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<span class="bold-text">$1</span>')
      .replace(/\n/g, "<br>");
  }
}
