import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActionService } from "../../services/action.service";
import { ActionPlan } from "src/app/models/action-plan.model";

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
  editingId: number | null = null;
  editAmount: number = 0;

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
    if (this.filter === "all") this.filtered = this.actions;
    else if (["EN_COURS", "TERMINE", "REPORTE"].includes(this.filter))
      this.filtered = this.actions.filter((a) => a.status === this.filter);
    else this.filtered = this.actions.filter((a) => a.category === this.filter);
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
      .subscribe(() => this.load());
  }

  reopen(a: ActionPlan) {
    this.actionService
      .updateActionStatus(a.id!, "EN_COURS")
      .subscribe(() => this.load());
  }

  startEdit(a: ActionPlan) {
    this.editingId = a.id!;
    this.editAmount = a.currentAmount || 0;
  }

  updateProgress(a: ActionPlan) {
    this.actionService
      .updateActionStatus(a.id!, a.status!, this.editAmount)
      .subscribe(() => {
        this.editingId = null;
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

  getCategoryIcon(cat: string): string {
    return (
      { EPARGNE: "💰", DETTE: "📉", BUDGET: "📊", INVESTISSEMENT: "📈" }[cat] ||
      ""
    );
  }
}
