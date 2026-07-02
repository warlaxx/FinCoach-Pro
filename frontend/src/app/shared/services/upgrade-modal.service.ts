import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface UpgradePrompt {
  /** User-facing explanation of the quota that was hit */
  message: string;
  /** Plan required to unlock the feature: 'PRO' | 'PREMIUM' */
  requiredPlan: string;
}

/**
 * Coordinates the global upgrade modal (TICKET-16).
 *
 * Any service that receives a { code: 'UPGRADE_REQUIRED' } API response calls
 * open(); the modal component (hosted once in AppComponent) listens to prompt$.
 */
@Injectable({ providedIn: 'root' })
export class UpgradeModalService {
  private promptSubject = new BehaviorSubject<UpgradePrompt | null>(null);
  prompt$: Observable<UpgradePrompt | null> = this.promptSubject.asObservable();

  open(message: string, requiredPlan: string = 'PRO'): void {
    this.promptSubject.next({ message, requiredPlan });
  }

  close(): void {
    this.promptSubject.next(null);
  }
}
