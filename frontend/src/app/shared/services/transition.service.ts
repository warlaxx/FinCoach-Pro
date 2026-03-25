import { Injectable } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class TransitionService {
  private _active = new BehaviorSubject<boolean>(false);
  active$ = this._active.asObservable();
  private _timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationStart)
    ).subscribe(() => {
      if (this._timeoutId !== null) {
        clearTimeout(this._timeoutId);
        this._timeoutId = null;
      }
      this._active.next(true);
    });

    this.router.events.pipe(
      filter(e =>
        e instanceof NavigationEnd ||
        e instanceof NavigationCancel ||
        e instanceof NavigationError
      )
    ).subscribe(() => {
      this._timeoutId = setTimeout(() => {
        this._active.next(false);
        this._timeoutId = null;
      }, 350);
    });
  }
}
