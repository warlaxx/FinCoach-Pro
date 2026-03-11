import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActionPlan, ChatMessage, DashboardData, FinancialProfile } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = 'http://localhost:8080/api';
  private userId = 'user-demo'; // In prod: from auth service

  constructor(private http: HttpClient) {}

  // Dashboard
  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.base}/dashboard/${this.userId}`);
  }

  // Profile
  saveProfile(profile: FinancialProfile): Observable<any> {
    return this.http.post<any>(`${this.base}/profile`, { ...profile, userId: this.userId });
  }

  // Actions
  getActions(): Observable<ActionPlan[]> {
    return this.http.get<ActionPlan[]>(`${this.base}/actions/${this.userId}`);
  }

  createAction(action: ActionPlan): Observable<ActionPlan> {
    return this.http.post<ActionPlan>(`${this.base}/actions`, { ...action, userId: this.userId });
  }

  updateActionStatus(id: number, status: string, currentAmount?: number): Observable<ActionPlan> {
    return this.http.put<ActionPlan>(`${this.base}/actions/${id}/status`, {
      status,
      ...(currentAmount !== undefined ? { currentAmount: String(currentAmount) } : {})
    });
  }

  deleteAction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/actions/${id}`);
  }

  // Chat
  getChatHistory(): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.base}/chat/${this.userId}`);
  }

  sendMessage(message: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.base}/chat`, { userId: this.userId, message });
  }

  clearChat(): Observable<void> {
    return this.http.delete<void>(`${this.base}/chat/${this.userId}`);
  }
}
