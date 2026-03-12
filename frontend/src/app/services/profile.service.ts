import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { FinancialProfile } from "../models/financial-profile.model";

@Injectable({ providedIn: "root" })
export class ProfileService {
  private base = "http://localhost:8080/api";
  private userId = "user-demo"; // TODO: replace with auth service

  constructor(private http: HttpClient) {}

  saveProfile(profile: FinancialProfile): Observable<any> {
    return this.http.post<any>(`${this.base}/profile`, {
      ...profile,
      userId: this.userId,
    });
  }
}
