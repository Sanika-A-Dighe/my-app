import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

type Candidate = {
  id: number;
  name: string;
  party: string;
  votes: number;
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
  private timerRef: ReturnType<typeof setInterval> | null = null;

  isDarkMode = false;
  displayUser = 'Guest';
  profileImage = '';
  countdown = '00:00:00';
  leadingCandidate = 'N/A';
  totalVotes = 0;
  isElectionEnded = false;

  constructor() {
    if (this.isBrowser) {
      this.isDarkMode = localStorage.getItem('theme') === 'dark';
    }
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }

    this.refreshState();
    this.timerRef = setInterval(() => {
      this.refreshState();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerRef) {
      clearInterval(this.timerRef);
      this.timerRef = null;
    }
  }

  toggleDarkMode(): void {
    if (!this.isBrowser) {
      return;
    }

    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  logout(): void {
    if (this.isBrowser) {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      const auditLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
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

  private refreshState(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    this.displayUser = currentUser ? currentUser.name || currentUser.email || 'User' : 'Guest';
    this.profileImage = currentUser?.profileImage || '';

    const candidates = JSON.parse(localStorage.getItem('candidates') || '[]') as Candidate[];
    const safeCandidates = Array.isArray(candidates) ? candidates : [];
    this.totalVotes = safeCandidates.reduce((sum, candidate) => sum + (candidate.votes || 0), 0);
    this.leadingCandidate = this.getLeadingCandidate(safeCandidates);

    this.countdown = this.getCountdown();
    this.isElectionEnded = this.countdown === '00:00:00';

    if (this.isElectionEnded) {
      localStorage.setItem('electionStatus', 'Closed');
    }

    this.applyTheme();
  }

  private getLeadingCandidate(candidates: Candidate[]): string {
    if (!candidates.length) {
      return 'N/A';
    }

    const leader = candidates.reduce((top, candidate) =>
      candidate.votes > top.votes ? candidate : top
    );

    return leader.votes > 0 ? leader.name : 'N/A';
  }

  private getCountdown(): string {
    const endTimeValue = localStorage.getItem('electionEndTime');
    if (!endTimeValue) {
      return '00:00:00';
    }

    const endTime = new Date(endTimeValue).getTime();
    const diff = endTime - Date.now();

    if (diff <= 0) {
      return '00:00:00';
    }

    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
