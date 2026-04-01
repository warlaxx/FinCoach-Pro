import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChatMessage } from '../../shared/models/chat-message.model';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private base = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient) {}

  getChatHistory(): Observable<ChatMessage[]> {
    return this.http.get<ApiResponse<ChatMessage[]>>(`${this.base}/chat/history`).pipe(
      map(res => {
        if (!res.success) throw new Error(res.message ?? 'Erreur lors du chargement de l\'historique');
        return res.data ?? [];
      })
    );
  }

  sendMessage(message: string): Observable<ChatMessage> {
    return this.http.post<ApiResponse<ChatMessage>>(`${this.base}/chat`, { message }).pipe(
      map(res => {
        if (!res.success) throw new Error(res.message ?? 'Erreur lors de l\'envoi du message');
        return res.data!;
      })
    );
  }

  clearChat(): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/chat`).pipe(
      map(res => {
        if (!res.success) throw new Error(res.message ?? 'Erreur lors de la suppression de l\'historique');
      })
    );
  }
}
