import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, AppNotification } from '../../services/notification.service';

/**
 * Notification bell + dropdown panel (TICKET-10).
 * Shows the unread count as a red badge and lists recent notifications.
 */
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss'],
})
export class NotificationBellComponent implements OnInit {
  open = false;
  notifications: AppNotification[] = [];
  unread = 0;

  constructor(
    public notificationService: NotificationService,
    private host: ElementRef<HTMLElement>,
  ) {}

  ngOnInit(): void {
    this.notificationService.startPolling();
    this.notificationService.notifications$.subscribe((n) => (this.notifications = n));
    this.notificationService.unread$.subscribe((c) => (this.unread = c));
  }

  toggle(): void {
    this.open = !this.open;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open && !this.host.nativeElement.contains(event.target as Node)) {
      this.open = false;
    }
  }

  onNotificationClick(n: AppNotification): void {
    if (!n.read) this.notificationService.markRead(n.id);
  }

  markAllRead(): void {
    this.notificationService.markAllRead();
  }

  iconFor(type: AppNotification['type']): string {
    switch (type) {
      case 'SUCCESS': return '🎉';
      case 'WARNING': return '⏰';
      case 'ALERT':   return '🚨';
      default:        return '🔔';
    }
  }
}
