import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatMessage } from '../models/chat-message.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private base = 'http://localhost:8080/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  getChatHistory(): Observable<ChatMessage[]> {
    const userId = this.auth.getCurrentUserId();
    return this.http.get<ChatMessage[]>(`${this.base}/chat/${userId}`);
  }

  sendMessage(message: string): Observable<ChatMessage> {
    const userId = this.auth.getCurrentUserId();
    return this.http.post<ChatMessage>(`${this.base}/chat`, { userId, message });
  }

  clearChat(): Observable<void> {
    const userId = this.auth.getCurrentUserId();
    return this.http.delete<void>(`${this.base}/chat/${userId}`);
  }
}
