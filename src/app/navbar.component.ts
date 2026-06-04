import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ElectionService } from './election.service';

type CurrentUser = {
  name?: string;
  email?: string;
  profileImage?: string;
};

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly router = inject(Router);
  private readonly electionService = inject(ElectionService);
  private stateSubscription: Subscription | null = null;

  isDarkMode = false;
  displayUser = 'Guest';
  profileImage = '';
  countdown = '00:00:00';
  leadingCandidate = 'N/A';
  totalVotes = 0;

  constructor() {
    if (this.isBrowser) {
      this.isDarkMode = localStorage.getItem('darkMode') === 'true' || localStorage.getItem('theme') === 'dark';
      this.applyTheme();
    }
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }

    this.electionService.initialize();
    this.refreshUser();
    this.syncState();
    this.stateSubscription = this.electionService.state$.subscribe(() => {
      this.refreshUser();
      this.syncState();
    });
  }

  ngOnDestroy(): void {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
      this.stateSubscription = null;
    }
  }

  toggleDarkMode(): void {
    if (!this.isBrowser) {
      return;
    }

    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', String(this.isDarkMode));
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  logout(): void {
    if (this.isBrowser) {
      const currentUser = this.getCurrentUser();
      const auditLogs = this.readJsonArray('auditLogs');
      auditLogs.push({
        action: 'Logout',
        username: currentUser?.name || currentUser?.email || 'User',
        timestamp: new Date().toLocaleString()
      });
      localStorage.setItem('auditLogs', JSON.stringify(auditLogs));
      localStorage.removeItem('currentUser');
      localStorage.removeItem('electionStartTime');
      localStorage.removeItem('electionEndTime');
    }

    this.router.navigate(['/login']);
  }

  private syncState(): void {
    const state = this.electionService.getState();
    const leadingCandidate = this.electionService.getLeadingCandidate();
    this.countdown = this.electionService.getCountdown();
    this.leadingCandidate = leadingCandidate?.name || 'N/A';
    this.totalVotes = this.electionService.getTotalVotes();

    if (state.electionEnded) {
      localStorage.setItem('electionStatus', 'Closed');
    }

    this.applyTheme();
  }

  private refreshUser(): void {
    const currentUser = this.getCurrentUser();
    this.displayUser = currentUser ? currentUser.name || currentUser.email || 'User' : 'Guest';
    this.profileImage = currentUser?.profileImage || '';
  }

  private getCurrentUser(): CurrentUser | null {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || 'null');
    } catch {
      return null;
    }
  }

  private readJsonArray(key: string): any[] {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private applyTheme(): void {
    if (!this.isBrowser) {
      return;
    }

    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
}
