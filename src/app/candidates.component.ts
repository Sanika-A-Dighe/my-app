import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

type Candidate = {
  id: number;
  name: string;
  party: string;
  votes: number;
};

@Component({
  selector: 'app-candidates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './candidates.component.html',
  styleUrl: './candidates.component.css'
})
export class CandidatesComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private timerRef: ReturnType<typeof setInterval> | null = null;
  private readonly electionEndTime = new Date('2026-04-20T23:59:59');

  candidates: Candidate[] = [
    { id: 1, name: 'Candidate 1', party: 'Party A', votes: 0 },
    { id: 2, name: 'Candidate 2', party: 'Party B', votes: 0 },
    { id: 3, name: 'Candidate 3', party: 'Party C', votes: 0 }
  ];

  currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  countdown = '00:00:00';
  isElectionEnded = false;
  showOtpPopup = false;
  generatedOtp = '';
  enteredOtp = '';
  otpError = '';
  selectedCandidate: Candidate | null = null;

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

  vote(candidate: Candidate): void {
    if (this.isElectionEnded) {
      alert('Election has ended');
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
    this.submitVote(this.selectedCandidate);
  }

  closeOtpPopup(): void {
    this.showOtpPopup = false;
    this.enteredOtp = '';
    this.otpError = '';
    this.selectedCandidate = null;
  }

  private submitVote(candidate: Candidate): void {
    if (this.isElectionEnded) {
      alert('Election has ended');
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const aadhaar = currentUser?.aadhaar;
    const votedAadhaars = JSON.parse(localStorage.getItem('votedAadhaars') || '[]');

    if (aadhaar && votedAadhaars.includes(aadhaar)) {
      alert('This Aadhaar has already voted');
      return;
    }

    if (currentUser?.hasVoted) {
      alert('You have already voted');
      return;
    }

    candidate.votes += 1;
    currentUser.hasVoted = true;

    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('candidates', JSON.stringify(this.candidates));
    if (aadhaar) {
      votedAadhaars.push(aadhaar);
      localStorage.setItem('votedAadhaars', JSON.stringify(votedAadhaars));
    }
    const maskedAadhaar = aadhaar ? `XXXXXXXX${aadhaar.slice(-4)}` : 'N/A';
    const voteReceipt = {
      voterName: currentUser?.name || 'N/A',
      voterAadhaar: maskedAadhaar,
      candidateName: candidate.name,
      partyName: candidate.party,
      votedAt: new Date().toLocaleString()
    };
    localStorage.setItem('voteReceipt', JSON.stringify(voteReceipt));
    alert('Vote submitted successfully');
    this.router.navigate(['/success']);
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
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
