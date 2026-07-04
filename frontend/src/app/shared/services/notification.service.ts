import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, timer } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  read: boolean;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/** How often the bell polls the backend for new notifications (ms). */
const POLL_INTERVAL_MS = 60_000;

/**
 * In-app notifications (TICKET-10).
 * Polls the backend on an interval and exposes the list + unread count as streams.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private base = `${environment.apiBaseUrl}/api`;

  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  private unreadSubject = new BehaviorSubject<number>(0);
  unread$ = this.unreadSubject.asObservable();

  private polling = false;

  constructor(private http: HttpClient) {}

  /** Starts polling (idempotent). Call once the user is authenticated. */
  startPolling(): void {
    if (this.polling) return;
    this.polling = true;
    timer(0, POLL_INTERVAL_MS)
      .pipe(switchMap(() => this.fetch()))
      .subscribe();
  }

  private fetch(): Observable<void> {
    return this.http
      .get<ApiResponse<{ notifications: AppNotification[]; unread: number }>>(`${this.base}/notifications`)
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            this.notificationsSubject.next(res.data.notifications);
            this.unreadSubject.next(res.data.unread);
          }
        }),
        map(() => void 0),
        catchError(() => of(void 0)),
      );
  }

  markRead(id: string): void {
    this.http.put<ApiResponse<void>>(`${this.base}/notifications/${id}/read`, {}).subscribe(() => {
      const updated = this.notificationsSubject.value.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      );
      this.notificationsSubject.next(updated);
      this.unreadSubject.next(updated.filter((n) => !n.read).length);
    });
  }

  markAllRead(): void {
    this.http.put<ApiResponse<void>>(`${this.base}/notifications/read-all`, {}).subscribe(() => {
      const updated = this.notificationsSubject.value.map((n) => ({ ...n, read: true }));
      this.notificationsSubject.next(updated);
      this.unreadSubject.next(0);
    });
  }

  /** Clears cached state on logout. */
  reset(): void {
    this.notificationsSubject.next([]);
    this.unreadSubject.next(0);
  }
}
