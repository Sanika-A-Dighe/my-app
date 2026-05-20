import { NgIf, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { NavbarComponent } from './navbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private sessionTimer: ReturnType<typeof setTimeout> | null = null;
  private routerSubscription: Subscription | null = null;
  private readonly sessionTimeoutMs = 5 * 60 * 1000;
  private readonly activityEvents: Array<keyof WindowEventMap> = ['click', 'mousemove', 'keydown'];

  protected readonly title = signal('my-app');
  showNavbar = true;

  ngOnInit(): void {
    this.updateNavbarVisibility(this.router.url);
    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateNavbarVisibility(event.urlAfterRedirects);
      }
    });

    if (!this.isBrowser) {
      return;
    }
    this.activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, this.handleUserActivity);
    });
    this.resetSessionTimer();
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
      this.routerSubscription = null;
    }

    if (!this.isBrowser) {
      return;
    }
    this.activityEvents.forEach((eventName) => {
      window.removeEventListener(eventName, this.handleUserActivity);
    });
    this.clearSessionTimer();
  }

  private readonly handleUserActivity = (): void => {
    this.resetSessionTimer();
  };

  private resetSessionTimer(): void {
    this.clearSessionTimer();
    this.sessionTimer = setTimeout(() => {
      this.expireSession();
    }, this.sessionTimeoutMs);
  }

  private clearSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  private expireSession(): void {
    if (!this.isBrowser) {
      return;
    }
    const currentUser = localStorage.getItem('currentUser');

    if (!currentUser) {
      this.resetSessionTimer();
      return;
    }

    localStorage.removeItem('currentUser');
    alert('Session expired. Please login again.');
    this.router.navigate(['/login']);
    this.resetSessionTimer();
  }

  private updateNavbarVisibility(url: string): void {
    this.showNavbar = url !== '/login' && url !== '/register';
  }
}
