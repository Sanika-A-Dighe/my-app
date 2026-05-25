import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
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
  private timerRef: ReturnType<typeof setInterval> | null = null;
  private readonly electionEndTime = new Date('2026-04-20T23:59:59');

  currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  userName = this.currentUser ? this.currentUser.name : '';
  hasVoted = this.currentUser ? !!this.currentUser.hasVoted : false;
  countdown = '00:00:00';
  isElectionEnded = false;

  ngOnInit(): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
    }

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
    this.timerRef = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  private updateCountdown(): void {
    const now = new Date().getTime();
    const end = this.electionEndTime.getTime();
    const diff = end - now;

    if (diff <= 0) {
      this.countdown = '00:00:00';
      this.isElectionEnded = true;
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
  }
}
