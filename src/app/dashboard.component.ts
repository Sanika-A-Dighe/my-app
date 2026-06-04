import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private timerRef: ReturnType<typeof setInterval> | null = null;

  currentUser: any = null;
  userName = '';
  hasVoted = false;
  countdown = '00:00:00';
  isElectionEnded = false;
  profileImage = '';

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }

    this.currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.userName = this.currentUser.name || this.currentUser.email || '';
    this.hasVoted = !!this.currentUser.hasVoted;
    this.profileImage = this.currentUser.profileImage || '';
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.timerRef) {
      clearInterval(this.timerRef);
      this.timerRef = null;
    }
  }

  private startCountdown(): void {
    this.updateCountdown();
    this.timerRef = setInterval(() => this.updateCountdown(), 1000);
  }

  private updateCountdown(): void {
    const endTimeValue = localStorage.getItem('electionEndTime');
    if (!endTimeValue) {
      this.countdown = '00:00:00';
      this.isElectionEnded = true;
      return;
    }

    const endTime = new Date(endTimeValue).getTime();
    const diff = endTime - Date.now();

    if (diff <= 0) {
      this.countdown = '00:00:00';
      this.isElectionEnded = true;
      localStorage.setItem('electionStatus', 'Closed');
      if (this.timerRef) {
        clearInterval(this.timerRef);
        this.timerRef = null;
      }
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    this.countdown = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    this.isElectionEnded = false;
  }
}
