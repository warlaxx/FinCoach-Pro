import { Injectable } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class TransitionService {
  private _active = new BehaviorSubject<boolean>(false);
  active$ = this._active.asObservable();

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationStart)
    ).subscribe(() => this._active.next(true));

    this.router.events.pipe(
      filter(e =>
        e instanceof NavigationEnd ||
        e instanceof NavigationCancel ||
        e instanceof NavigationError
      )
    ).subscribe(() => {
      setTimeout(() => this._active.next(false), 350);
    });
  }
}
