import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActionService } from "./action.service";
import { ActionPlan } from "../../shared/models/action-plan.model";

@Component({
  selector: "app-action-plan",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./action-plan.component.html",
  styleUrls: ["./action-plan.component.scss"],
})
export class ActionPlanComponent implements OnInit {
  actions: ActionPlan[] = [];
  filtered: ActionPlan[] = [];
  loading = true;
  showNew = false;
  filter = "all";
  categoryFilter = "all";
  editingId: number | null = null;
  editAmount: number = 0;
  showConfetti = false;

  newAction: Partial<ActionPlan> = {
    title: "",
    description: "",
    category: "EPARGNE",
    priority: "MOYENNE",
    targetAmount: undefined,
    currentAmount: 0,
  };

  constructor(private actionService: ActionService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.actionService.getActions().subscribe({
      next: (a) => {
        this.actions = a;
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  applyFilter() {
    let result = this.actions;

    // Status filter
    if (this.filter !== "all") {
      result = result.filter((a) => a.status === this.filter);
    }

    // Category filter
    if (this.categoryFilter !== "all") {
      result = result.filter((a) => a.category === this.categoryFilter);
    }

    this.filtered = result;
  }

  setStatusFilter(f: string) {
    this.filter = f;
    this.applyFilter();
  }

  setCategoryFilter(f: string) {
    this.categoryFilter = f;
    this.applyFilter();
  }

  createAction() {
    this.actionService
      .createAction(this.newAction as ActionPlan)
      .subscribe(() => {
        this.showNew = false;
        this.newAction = {
          title: "",
          description: "",
          category: "EPARGNE",
          priority: "MOYENNE",
          currentAmount: 0,
        };
        this.load();
      });
  }

  markDone(a: ActionPlan) {
    this.actionService
      .updateActionStatus(a.id!, "TERMINE", a.targetAmount || undefined)
      .subscribe(() => {
        this.triggerConfetti();
        this.load();
      });
  }

  reopen(a: ActionPlan) {
    this.actionService
      .updateActionStatus(a.id!, "EN_COURS")
      .subscribe(() => this.load());
  }

  abandon(a: ActionPlan) {
    this.actionService
      .updateActionStatus(a.id!, "ABANDONNE")
      .subscribe(() => this.load());
  }

  startEdit(a: ActionPlan) {
    this.editingId = a.id!;
    this.editAmount = a.currentAmount || 0;
  }

  updateProgress(a: ActionPlan) {
    const wasNotDone = a.status !== "TERMINE";
    this.actionService
      .updateActionStatus(a.id!, a.status!, this.editAmount)
      .subscribe((updated) => {
        this.editingId = null;
        if (wasNotDone && updated.status === "TERMINE") {
          this.triggerConfetti();
        }
        this.load();
      });
  }

  deleteAction(a: ActionPlan) {
    if (confirm("Supprimer cette action ?")) {
      this.actionService.deleteAction(a.id!).subscribe(() => this.load());
    }
  }

  countByStatus(s: string) {
    return this.actions.filter((a) => a.status === s).length;
  }

  totalProgress(): number {
    const withTarget = this.actions.filter(
      (a) => a.targetAmount && a.targetAmount > 0
    );
    if (!withTarget.length) return 0;
    return (
      withTarget.reduce((sum, a) => sum + (a.progressPercent || 0), 0) /
      withTarget.length
    );
  }

  totalSaved(): number {
    return this.actions.reduce((sum, a) => sum + (a.currentAmount || 0), 0);
  }

  isOverdue(a: ActionPlan): boolean {
    return (
      !!a.deadline &&
      new Date(a.deadline) < new Date() &&
      a.status !== "TERMINE"
    );
  }

  daysRemaining(a: ActionPlan): number | null {
    if (!a.deadline) return null;
    const diff = new Date(a.deadline).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getDeadlineLabel(a: ActionPlan): string {
    const days = this.daysRemaining(a);
    if (days === null) return "";
    if (a.status === "TERMINE") return "";
    if (days < 0) return `En retard de ${Math.abs(days)} jour${Math.abs(days) > 1 ? "s" : ""}`;
    if (days === 0) return "Aujourd'hui !";
    if (days === 1) return "Demain";
    return `${days} jours restants`;
  }

  getCategoryIcon(cat: string): string {
    return (
      { EPARGNE: "\u{1F4B0}", DETTE: "\u{1F4C9}", BUDGET: "\u{1F4CA}", INVESTISSEMENT: "\u{1F4C8}", AUTRE: "\u{1F3AF}" }[cat] ||
      ""
    );
  }

  getStatusIcon(status: string): string {
    return (
      { A_FAIRE: "\u{25CB}", EN_COURS: "\u{25B6}", TERMINE: "\u2713", ABANDONNE: "\u{2715}" }[status] ||
      "\u{25B6}"
    );
  }

  getStatusLabel(status: string): string {
    return (
      { A_FAIRE: "\u00C0 faire", EN_COURS: "En cours", TERMINE: "Termin\u00E9", ABANDONNE: "Abandonn\u00E9" }[status] ||
      status
    );
  }

  triggerConfetti() {
    this.showConfetti = true;
    setTimeout(() => (this.showConfetti = false), 3000);
  }
}
