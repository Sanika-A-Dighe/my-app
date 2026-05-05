import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h2>Dashboard</h2>
      <p>Name: {{ userName }}</p>
      <p *ngIf="hasVoted">User has already voted.</p>
      <p *ngIf="!hasVoted">User has not voted.</p>
    </div>
  `
})
export class DashboardComponent {
  currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  userName = this.currentUser ? this.currentUser.name : '';
  hasVoted = this.currentUser ? !!this.currentUser.hasVoted : false;
}
