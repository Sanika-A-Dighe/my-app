import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-voter-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './voter-card.component.html',
  styleUrl: './voter-card.component.css'
})
export class VoterCardComponent implements OnInit {
  private readonly router = inject(Router);

  currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  ngOnInit(): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
    }
  }

  get maskedAadhaar(): string {
    const aadhaar = this.currentUser?.aadhaar || '';
    if (aadhaar.length < 4) {
      return 'N/A';
    }
    return `XXXXXXXX${aadhaar.slice(-4)}`;
  }
}
