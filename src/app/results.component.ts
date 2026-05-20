import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

type Candidate = {
  id: number;
  name: string;
  party: string;
  votes: number;
};

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  template: ''
})
export class ResultsComponent {
  candidates: Candidate[] = JSON.parse(localStorage.getItem('candidates') || '[]');
}
