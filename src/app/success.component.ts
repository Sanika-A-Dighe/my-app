import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

type VoteReceipt = {
  voterName: string;
  voterAadhaar: string;
  candidateName: string;
  partyName: string;
  votedAt: string;
};

@Component({
  selector: 'app-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './success.component.html',
  styleUrl: './success.component.css'
})
export class SuccessComponent implements OnInit {
  private readonly router = inject(Router);

  receipt: VoteReceipt | null = null;

  ngOnInit(): void {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.receipt = JSON.parse(localStorage.getItem('voteReceipt') || 'null');
  }
}
