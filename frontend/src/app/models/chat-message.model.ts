export interface ChatMessage {
  id?: number;
  userId: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}
