import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ChatMessage } from "../models/chat-message.model";

@Injectable({ providedIn: "root" })
export class ChatService {
  private base = "http://localhost:8080/api";
  private userId = "user-demo"; // TODO: replace with auth service

  constructor(private http: HttpClient) {}

  getChatHistory(): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.base}/chat/${this.userId}`);
  }

  sendMessage(message: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.base}/chat`, {
      userId: this.userId,
      message,
    });
  }

  clearChat(): Observable<void> {
    return this.http.delete<void>(`${this.base}/chat/${this.userId}`);
  }
}
