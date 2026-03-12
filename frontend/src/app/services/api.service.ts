// src/app/services/api.service.ts
import { Injectable } from "@angular/core";
import { DashboardService } from "./dashboard.service";
import { ProfileService } from "./profile.service";
import { ActionService } from "./action.service";
import { ChatService } from "./chat.service";

@Injectable({ providedIn: "root" })
export class ApiService {
  constructor(
    public dashboard: DashboardService,
    public profile: ProfileService,
    public action: ActionService,
    public chat: ChatService
  ) {}
}
