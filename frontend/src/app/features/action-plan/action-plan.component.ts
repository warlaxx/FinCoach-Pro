import { Component, OnInit, OnDestroy } from "@angular/core";
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
export class ActionPlanComponent implements OnInit, OnDestroy {
  actions: ActionPlan[] = [];
  filtered: ActionPlan[] = [];
  loading = true;
  showNew = false;
  creating = false;
  filter = "all";
  categoryFilter = "all";
  editingId: number | null = null;
  editAmount: number = 0;
  showConfetti = false;

  toastMessage = "";
  toastType: "success" | "error" = "success";
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private confettiTimer: ReturnType<typeof setTimeout> | null = null;

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

  ngOnDestroy() {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.confettiTimer) clearTimeout(this.confettiTimer);
  }

  load() {
    this.loading = true;
    this.actionService.getActions().subscribe({
      next: (a) => {
        this.actions = a;
        this.applyFilter();
        this.loading = false;
      },
      error: (err: Error) => {
        this.loading = false;
        this.showToast(err?.message ?? "Impossible de charger vos objectifs.", "error");
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
    const title = (this.newAction.title ?? "").trim();
    if (!title || this.creating) return;

    this.creating = true;
    this.actionService
      .createAction({ ...this.newAction, title } as ActionPlan)
      .subscribe({
        next: () => {
          this.creating = false;
          this.showNew = false;
          this.newAction = {
            title: "",
            description: "",
            category: "EPARGNE",
            priority: "MOYENNE",
            currentAmount: 0,
          };
          this.showToast("Objectif créé avec succès.", "success");
          this.load();
        },
        error: (err: Error) => {
          // La modale d'upgrade s'ouvre déjà via le service en cas de quota atteint ;
          // le formulaire reste ouvert pour ne pas perdre la saisie.
          this.creating = false;
          this.showToast(err?.message ?? "Erreur lors de la création.", "error");
        },
      });
  }

  markDone(a: ActionPlan) {
    this.actionService
      .updateActionStatus(a.id!, "TERMINE", a.targetAmount || undefined)
      .subscribe({
        next: () => {
          this.triggerConfetti();
          this.load();
        },
        error: (err: Error) =>
          this.showToast(err?.message ?? "Erreur lors de la mise à jour.", "error"),
      });
  }

  reopen(a: ActionPlan) {
    this.actionService.updateActionStatus(a.id!, "EN_COURS").subscribe({
      next: () => this.load(),
      error: (err: Error) =>
        this.showToast(err?.message ?? "Erreur lors de la mise à jour.", "error"),
    });
  }

  abandon(a: ActionPlan) {
    this.actionService.updateActionStatus(a.id!, "ABANDONNE").subscribe({
      next: () => this.load(),
      error: (err: Error) =>
        this.showToast(err?.message ?? "Erreur lors de la mise à jour.", "error"),
    });
  }

  startEdit(a: ActionPlan) {
    this.editingId = a.id!;
    this.editAmount = a.currentAmount || 0;
  }

  updateProgress(a: ActionPlan) {
    const wasNotDone = a.status !== "TERMINE";
    this.actionService
      .updateActionStatus(a.id!, a.status!, Math.max(0, this.editAmount || 0))
      .subscribe({
        next: (updated) => {
          this.editingId = null;
          if (wasNotDone && updated.status === "TERMINE") {
            this.triggerConfetti();
          }
          this.load();
        },
        error: (err: Error) =>
          this.showToast(err?.message ?? "Erreur lors de la mise à jour.", "error"),
      });
  }

  deleteAction(a: ActionPlan) {
    if (confirm("Supprimer cette action ?")) {
      this.actionService.deleteAction(a.id!).subscribe({
        next: () => this.load(),
        error: (err: Error) =>
          this.showToast(err?.message ?? "Erreur lors de la suppression.", "error"),
      });
    }
  }

  private showToast(message: string, type: "success" | "error"): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMessage = message;
    this.toastType = type;
    this.toastTimer = setTimeout(() => (this.toastMessage = ""), 4000);
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

  /** Parse YYYY-MM-DD as local date (not UTC) to avoid timezone off-by-one */
  private parseLocalDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  private startOfToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  isOverdue(a: ActionPlan): boolean {
    return (
      !!a.deadline &&
      this.parseLocalDate(a.deadline) < this.startOfToday() &&
      a.status !== "TERMINE"
    );
  }

  daysRemaining(a: ActionPlan): number | null {
    if (!a.deadline) return null;
    const deadline = this.parseLocalDate(a.deadline);
    const today = this.startOfToday();
    const diff = deadline.getTime() - today.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
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
    if (this.confettiTimer) clearTimeout(this.confettiTimer);
    this.showConfetti = true;
    this.confettiTimer = setTimeout(() => (this.showConfetti = false), 3000);
  }
}
