import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
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
  imports: [CommonModule],
  templateUrl: './candidates.component.html',
  styleUrl: './candidates.component.css'
})
export class CandidatesComponent implements OnInit {
  private readonly router = inject(Router);

  candidates: Candidate[] = [
    { id: 1, name: 'Candidate 1', party: 'Party A', votes: 0 },
    { id: 2, name: 'Candidate 2', party: 'Party B', votes: 0 },
    { id: 3, name: 'Candidate 3', party: 'Party C', votes: 0 }
  ];

  currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  ngOnInit(): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
    }
  }

  vote(candidate: Candidate): void {
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
}
