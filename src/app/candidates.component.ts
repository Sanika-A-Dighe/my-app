import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Candidate, ElectionService } from './election.service';

@Component({
  selector: 'app-candidates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './candidates.component.html',
  styleUrl: './candidates.component.css'
})
export class CandidatesComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly electionService = inject(ElectionService);
  private stateSubscription: Subscription | null = null;
  private timerRef: ReturnType<typeof setInterval> | null = null;

  candidates: Candidate[] = [];
  currentUser: any = null;
  hasVoted = false;
  electionStatus: 'Active' | 'Closed' = 'Active';
  countdown = '00:00:00';
  isElectionEnded = false;
  isHumanChecked = false;
  showOtpPopup = false;
  generatedOtp = '';
  enteredOtp = '';
  otpError = '';
  selectedCandidate: Candidate | null = null;

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }

    this.currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.electionService.initialize();
    this.syncState();
    this.stateSubscription = this.electionService.state$.subscribe((state) => {
      this.candidates = state.candidates;
      this.countdown = state.countdown;
      this.isElectionEnded = state.electionEnded;
      this.electionStatus = state.electionStatus;
    });

    this.timerRef = setInterval(() => {
      this.syncState();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
      this.stateSubscription = null;
    }

    if (this.timerRef) {
      clearInterval(this.timerRef);
      this.timerRef = null;
    }
  }

  vote(candidate: Candidate): void {
    this.syncState();

    if (this.electionStatus === 'Closed' || this.isElectionEnded) {
      alert('Election has ended');
      return;
    }

    if (this.hasVoted) {
      alert('You have already voted');
      return;
    }

    if (!this.isHumanChecked) {
      alert('Please verify "I am not a robot"');
      return;
    }

    this.selectedCandidate = candidate;
    this.generatedOtp = this.generateOtp();
    this.enteredOtp = '';
    this.otpError = '';
    this.showOtpPopup = true;
  }

  verifyOtpAndSubmit(): void {
    if (this.enteredOtp !== this.generatedOtp) {
      this.otpError = 'Invalid OTP';
      return;
    }

    if (!this.selectedCandidate) {
      return;
    }

    this.showOtpPopup = false;

    const result = this.electionService.vote(this.selectedCandidate.id);
    if (!result.success) {
      alert(result.message);
      return;
    }

    alert(result.message);
    this.router.navigate(['/success']);
  }

  closeOtpPopup(): void {
    this.showOtpPopup = false;
    this.enteredOtp = '';
    this.otpError = '';
    this.selectedCandidate = null;
  }

  trackByCandidateId(_: number, candidate: Candidate): number {
    return candidate.id;
  }

  private syncState(): void {
    const state = this.electionService.getState();
    this.currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    this.hasVoted = !!this.currentUser?.hasVoted;
    this.candidates = state.candidates;
    this.countdown = this.electionService.getCountdown();
    this.isElectionEnded = state.electionEnded;
    this.electionStatus = state.electionStatus;
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
