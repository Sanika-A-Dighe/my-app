import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

type Candidate = {
  id: number;
  name: string;
  party: string;
  votes: number;
};

type CandidateResult = Candidate & {
  percentage: number;
};

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results.component.html',
  styleUrl: './results.component.css'
})
export class ResultsComponent implements OnInit {
  private readonly router = inject(Router);

  candidates: Candidate[] = JSON.parse(localStorage.getItem('candidates') || '[]');
  totalVotes = 0;
  candidateResults: CandidateResult[] = [];

  ngOnInit(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.totalVotes = this.candidates.reduce((sum, candidate) => sum + candidate.votes, 0);
    this.candidateResults = this.candidates.map((candidate) => ({
      ...candidate,
      percentage: this.totalVotes > 0 ? (candidate.votes / this.totalVotes) * 100 : 0
    }));
  }
}
