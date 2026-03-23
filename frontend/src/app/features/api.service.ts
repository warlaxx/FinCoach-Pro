import { Injectable } from "@angular/core";
import { DashboardService } from "./dashboard/dashboard.service";
import { ProfileService } from "./settings/profile.service";
import { ActionService } from "./action-plan/action.service";
import { ChatService } from "./chat/chat.service";

@Injectable({ providedIn: "root" })
export class ApiService {
  constructor(
    public dashboard: DashboardService,
    public profile: ProfileService,
    public action: ActionService,
    public chat: ChatService
  ) {}
}
