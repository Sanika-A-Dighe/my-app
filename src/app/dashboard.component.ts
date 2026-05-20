import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private readonly router = inject(Router);

  currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  userName = this.currentUser ? this.currentUser.name : '';
  hasVoted = this.currentUser ? !!this.currentUser.hasVoted : false;

  ngOnInit(): void {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
    }
  }
}
