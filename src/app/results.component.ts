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
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results.component.html',
  styleUrl: './results.component.css'
})
export class ResultsComponent implements OnInit {
  private readonly router = inject(Router);

  candidates: Candidate[] = JSON.parse(localStorage.getItem('candidates') || '[]');

  ngOnInit(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) {
      this.router.navigate(['/login']);
    }
  }
}
