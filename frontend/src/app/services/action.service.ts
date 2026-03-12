import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ActionPlan } from "../models/action-plan.model";

@Injectable({ providedIn: "root" })
export class ActionService {
  private base = "http://localhost:8080/api";
  private userId = "user-demo"; // TODO: replace with auth service

  constructor(private http: HttpClient) {}

  getActions(): Observable<ActionPlan[]> {
    return this.http.get<ActionPlan[]>(`${this.base}/actions/${this.userId}`);
  }

  createAction(action: ActionPlan): Observable<ActionPlan> {
    return this.http.post<ActionPlan>(`${this.base}/actions`, {
      ...action,
      userId: this.userId,
    });
  }

  updateActionStatus(
    id: number,
    status: string,
    currentAmount?: number
  ): Observable<ActionPlan> {
    return this.http.put<ActionPlan>(`${this.base}/actions/${id}/status`, {
      status,
      ...(currentAmount !== undefined
        ? { currentAmount: String(currentAmount) }
        : {}),
    });
  }

  deleteAction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/actions/${id}`);
  }
}
