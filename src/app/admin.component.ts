import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

type Candidate = {
  id: number;
  name: string;
  party: string;
  votes: number;
};

type AuditLog = {
  action: string;
  username: string;
  timestamp: string;
};

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent {
  adminEmail = '';
  adminPassword = '';
  loginError = '';
  isAdminLoggedIn = false;

  newCandidateName = '';
  newCandidateParty = '';

  candidates: Candidate[] = [];
  totalUsers = 0;
  electionStatus: 'Active' | 'Closed' = 'Active';
  auditLogs: AuditLog[] = [];

  constructor() {
    this.loadData();
  }

  loginAdmin(): void {
    this.loginError = '';
    if (this.adminEmail === 'admin@vote.com' && this.adminPassword === 'admin123') {
      this.isAdminLoggedIn = true;
      return;
    }
    this.loginError = 'Invalid admin credentials';
  }

  addCandidate(): void {
    const name = this.newCandidateName.trim();
    const party = this.newCandidateParty.trim();

    if (!name || !party) {
      return;
    }

    const candidate: Candidate = {
      id: Date.now(),
      name,
      party,
      votes: 0
    };

    this.candidates.push(candidate);
    localStorage.setItem('candidates', JSON.stringify(this.candidates));
    this.newCandidateName = '';
    this.newCandidateParty = '';
  }

  deleteCandidate(id: number): void {
    this.candidates = this.candidates.filter((candidate) => candidate.id !== id);
    localStorage.setItem('candidates', JSON.stringify(this.candidates));
  }

  get totalVotes(): number {
    return this.candidates.reduce((sum, candidate) => sum + candidate.votes, 0);
  }

  startElection(): void {
    this.electionStatus = 'Active';
    localStorage.setItem('electionStatus', this.electionStatus);
  }

  endElection(): void {
    this.electionStatus = 'Closed';
    localStorage.setItem('electionStatus', this.electionStatus);
  }

  private loadData(): void {
    const savedCandidates = JSON.parse(localStorage.getItem('candidates') || '[]');
    this.candidates = Array.isArray(savedCandidates) ? savedCandidates : [];
    this.totalUsers = JSON.parse(localStorage.getItem('users') || '[]').length;
    const savedStatus = localStorage.getItem('electionStatus');
    if (savedStatus === 'Closed') {
      this.electionStatus = 'Closed';
    } else {
      this.electionStatus = 'Active';
      localStorage.setItem('electionStatus', this.electionStatus);
    }
    const savedLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    this.auditLogs = Array.isArray(savedLogs) ? savedLogs : [];
  }
}
