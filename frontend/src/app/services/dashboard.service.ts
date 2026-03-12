import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { DashboardData } from "../models/dashboard-data.model";

@Injectable({ providedIn: "root" })
export class DashboardService {
  private base = "http://localhost:8080/api";
  private userId = "user-demo"; // TODO: replace with auth service

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(
      `${this.base}/dashboard/${this.userId}`
    );
  }
}
