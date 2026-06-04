import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ElectionService } from './election.service';

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
  private readonly electionService = inject(ElectionService);
  private stateSubscription: Subscription | null = null;

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
    this.electionService.initialize();
    this.syncState();
    this.stateSubscription = this.electionService.state$.subscribe((state) => {
      this.countdown = state.countdown;
      this.isElectionEnded = state.electionEnded;
    });
  }

  ngOnDestroy(): void {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
      this.stateSubscription = null;
    }
  }

  private syncState(): void {
    const state = this.electionService.getState();
    this.countdown = this.electionService.getCountdown();
    this.isElectionEnded = state.electionEnded;
    this.currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    this.userName = this.currentUser?.name || this.currentUser?.email || '';
    this.hasVoted = !!this.currentUser?.hasVoted;
    this.profileImage = this.currentUser?.profileImage || '';
  }
}
