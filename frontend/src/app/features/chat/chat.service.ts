import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatMessage } from '../../shared/models/chat-message.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private base = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient) {}

  getChatHistory(): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.base}/chat/history`);
  }

  sendMessage(message: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.base}/chat`, { message });
  }

  clearChat(): Observable<void> {
    return this.http.delete<void>(`${this.base}/chat`);
  }
}
