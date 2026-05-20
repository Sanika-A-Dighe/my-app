import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

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
  template: ''
})
export class CandidatesComponent {
  candidates: Candidate[] = [
    { id: 1, name: 'Candidate 1', party: 'Party A', votes: 0 },
    { id: 2, name: 'Candidate 2', party: 'Party B', votes: 0 },
    { id: 3, name: 'Candidate 3', party: 'Party C', votes: 0 }
  ];

  currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  vote(candidate: Candidate): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

    if (currentUser?.hasVoted) {
      alert('You have already voted');
      return;
    }

    candidate.votes += 1;
    currentUser.hasVoted = true;

    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('candidates', JSON.stringify(this.candidates));
    alert('Vote submitted successfully');
  }
}
