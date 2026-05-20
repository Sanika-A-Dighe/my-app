import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  userName = this.currentUser ? this.currentUser.name : '';
  hasVoted = this.currentUser ? !!this.currentUser.hasVoted : false;
}
