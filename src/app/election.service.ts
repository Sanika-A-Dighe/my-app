import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Candidate = {
  id: number;
  name: string;
  party: string;
  image: string;
  votes: number;
};

export type ElectionState = {
  candidates: Candidate[];
  leadingCandidate: Candidate | null;
  totalVotes: number;
  countdown: string;
  electionEnded: boolean;
  electionStatus: 'Active' | 'Closed';
};

type StoredVoteReceipt = {
  voterName: string;
  voterAadhaar: string;
  candidateName: string;
  partyName: string;
  votedAt: string;
};

type CurrentUser = {
  name?: string;
  email?: string;
  aadhaar?: string;
  hasVoted?: boolean;
  profileImage?: string;
};

const ELECTION_DURATION_MS = 3 * 60 * 60 * 1000;

@Injectable({
  providedIn: 'root'
})
export class ElectionService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly stateSubject = new BehaviorSubject<ElectionState>(this.createEmptyState());
  readonly state$ = this.stateSubject.asObservable();

  private timerRef: ReturnType<typeof setInterval> | null = null;
  private initialized = false;

  private readonly candidateSeeds = [
    { name: 'Rahul Sharma', party: 'Progress Party', color: '#2563eb' },
    { name: 'Priya Patel', party: 'Future India Party', color: '#7c3aed' },
    { name: 'Amit Verma', party: 'National Development Party', color: '#0f766e' },
    { name: 'Sneha Joshi', party: 'Green India Party', color: '#16a34a' },
    { name: 'Arjun Singh', party: 'Youth Power Party', color: '#ea580c' },
    { name: "Kavya Mehta", party: "People's Voice Party", color: '#db2777' }
  ];

  constructor() {
    if (this.isBrowser) {
      this.initialize();
    }
  }

  initialize(): void {
    if (!this.isBrowser || this.initialized) {
      return;
    }

    this.ensureElectionWindow();
    this.ensureCandidates();
    this.emitState();
    this.startTimer();
    this.initialized = true;
  }

  refresh(): void {
    if (!this.isBrowser) {
      return;
    }

    this.ensureElectionWindow();
    this.ensureCandidates();
    this.emitState();
  }

  getState(): ElectionState {
    this.initialize();
    return this.stateSubject.value;
  }

  getCandidates(): Candidate[] {
    return this.getState().candidates;
  }

  getLeadingCandidate(): Candidate | null {
    return this.getState().leadingCandidate;
  }

  getLeadingCandidateName(): string {
    return this.getState().leadingCandidate?.name || 'N/A';
  }

  getTotalVotes(): number {
    return this.getState().totalVotes;
  }

  getCountdown(): string {
    return this.getState().countdown;
  }

  isElectionEnded(): boolean {
    return this.getState().electionEnded;
  }

  vote(candidateId: number): { success: boolean; message: string } {
    if (!this.isBrowser) {
      return { success: false, message: 'Browser only' };
    }

    this.ensureElectionWindow();
    this.ensureCandidates();

    if (this.isElectionEnded()) {
      return { success: false, message: 'Election has ended' };
    }

    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'Please login again' };
    }

    const savedCandidates = this.readCandidates();
    const candidateIndex = savedCandidates.findIndex((candidate) => candidate.id === candidateId);
    if (candidateIndex === -1) {
      return { success: false, message: 'Candidate not found' };
    }

    const aadhaar = currentUser.aadhaar || '';
    const votedAadhaars = this.readVotedAadhaars();

    if ((currentUser.hasVoted || false) || (aadhaar && votedAadhaars.includes(aadhaar))) {
      return { success: false, message: 'You have already voted' };
    }

    savedCandidates[candidateIndex] = {
      ...savedCandidates[candidateIndex],
      votes: (Number(savedCandidates[candidateIndex].votes) || 0) + 1
    };

    currentUser.hasVoted = true;
    this.saveCurrentUser(currentUser);
    this.saveCandidates(savedCandidates);
    this.saveVotesSnapshot(savedCandidates);

    if (aadhaar) {
      votedAadhaars.push(aadhaar);
      localStorage.setItem('votedAadhaars', JSON.stringify(votedAadhaars));
    }

    const receipt: StoredVoteReceipt = {
      voterName: currentUser.name || currentUser.email || 'N/A',
      voterAadhaar: aadhaar ? `XXXXXXXX${aadhaar.slice(-4)}` : 'N/A',
      candidateName: savedCandidates[candidateIndex].name,
      partyName: savedCandidates[candidateIndex].party,
      votedAt: new Date().toLocaleString()
    };
    localStorage.setItem('voteReceipt', JSON.stringify(receipt));

    const auditLogs = this.readJsonArray('auditLogs');
    auditLogs.push({
      action: 'Vote Submission',
      username: currentUser.name || currentUser.email || 'User',
      timestamp: new Date().toLocaleString()
    });
    localStorage.setItem('auditLogs', JSON.stringify(auditLogs));

    this.emitState();
    return { success: true, message: 'Vote submitted successfully' };
  }

  private startTimer(): void {
    if (this.timerRef) {
      clearInterval(this.timerRef);
    }

    this.timerRef = setInterval(() => {
      this.emitState();
    }, 1000);
  }

  private emitState(): void {
    const candidates = this.readCandidates();
    const countdown = this.calculateCountdown();
    const totalVotes = candidates.reduce((sum, candidate) => sum + (Number(candidate.votes) || 0), 0);
    const leadingCandidate = candidates.length
      ? candidates.reduce((leader, candidate) =>
          (Number(candidate.votes) || 0) > (Number(leader.votes) || 0) ? candidate : leader
        )
      : null;
    const electionEnded = countdown === '00:00:00';

    if (electionEnded) {
      localStorage.setItem('electionStatus', 'Closed');
    } else if (!localStorage.getItem('electionStatus')) {
      localStorage.setItem('electionStatus', 'Active');
    }

    this.stateSubject.next({
      candidates,
      leadingCandidate,
      totalVotes,
      countdown,
      electionEnded,
      electionStatus: electionEnded ? 'Closed' : 'Active'
    });
  }

  private ensureElectionWindow(): void {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      return;
    }

    const startTimeValue = localStorage.getItem('electionStartTime');
    const endTimeValue = localStorage.getItem('electionEndTime');

    if (startTimeValue && !endTimeValue) {
      const startTime = new Date(startTimeValue).getTime();
      if (!Number.isNaN(startTime)) {
        const endTime = new Date(startTime + ELECTION_DURATION_MS);
        localStorage.setItem('electionEndTime', endTime.toISOString());
      }
    } else if (!startTimeValue && endTimeValue) {
      const endTime = new Date(endTimeValue).getTime();
      if (!Number.isNaN(endTime)) {
        const startTime = new Date(endTime - ELECTION_DURATION_MS);
        localStorage.setItem('electionStartTime', startTime.toISOString());
      }
    } else if (!startTimeValue && !endTimeValue) {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + ELECTION_DURATION_MS);
      localStorage.setItem('electionStartTime', startTime.toISOString());
      localStorage.setItem('electionEndTime', endTime.toISOString());
    }

    if (!localStorage.getItem('electionStatus')) {
      localStorage.setItem('electionStatus', 'Active');
    }
  }

  private ensureCandidates(): void {
    const savedCandidates = this.readCandidatesRaw();

    if (!savedCandidates.length) {
      this.saveCandidates(this.createDefaultCandidates());
      return;
    }

    const looksLikePlaceholderData = savedCandidates.length < 6
      && savedCandidates.every((candidate) =>
        typeof candidate?.name === 'string' && candidate.name.startsWith('Candidate')
      );

    if (looksLikePlaceholderData) {
      this.saveCandidates(this.createDefaultCandidates());
      return;
    }

    const normalizedCandidates = savedCandidates.map((candidate, index) => {
      const fallback = this.candidateSeeds[index % this.candidateSeeds.length];
      return this.normalizeCandidate(candidate, index, fallback);
    });

    this.saveCandidates(normalizedCandidates);
  }

  private createDefaultCandidates(): Candidate[] {
    return this.candidateSeeds.map((seed, index) => ({
      id: index + 1,
      name: seed.name,
      party: seed.party,
      image: this.createCandidateImage(seed.name, seed.party, seed.color),
      votes: this.getRandomVotes()
    }));
  }

  private normalizeCandidate(candidate: Partial<Candidate>, index: number, fallback: { name: string; party: string; color: string }): Candidate {
    const name = typeof candidate.name === 'string' && candidate.name.trim() ? candidate.name : fallback.name;
    const party = typeof candidate.party === 'string' && candidate.party.trim() ? candidate.party : fallback.party;
    const image = typeof candidate.image === 'string' && candidate.image.trim()
      ? candidate.image
      : this.createCandidateImage(name, party, fallback.color);

    return {
      id: Number(candidate.id) || index + 1,
      name,
      party,
      image,
      votes: Number(candidate.votes) || 0
    };
  }

  private createCandidateImage(name: string, party: string, color: string): string {
    const initials = this.getInitials(name);
    const secondary = this.shiftColor(color, 24);

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${color}" />
            <stop offset="100%" stop-color="${secondary}" />
          </linearGradient>
        </defs>
        <rect width="256" height="256" rx="36" fill="url(#g)" />
        <circle cx="128" cy="92" r="44" fill="rgba(255,255,255,0.18)" />
        <text x="128" y="110" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="700" fill="#ffffff">${initials}</text>
        <text x="128" y="180" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" letter-spacing="1" fill="rgba(255,255,255,0.92)">${party}</text>
      </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  private getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) {
      return 'V';
    }

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }

  private shiftColor(hex: string, amount: number): string {
    const normalized = hex.replace('#', '');
    const num = Number.parseInt(normalized, 16);
    const clamp = (value: number) => Math.min(255, Math.max(0, value));
    const r = clamp((num >> 16) + amount);
    const g = clamp(((num >> 8) & 0xff) + amount);
    const b = clamp((num & 0xff) + amount);
    return `rgb(${r}, ${g}, ${b})`;
  }

  private calculateCountdown(): string {
    const endTimeValue = localStorage.getItem('electionEndTime');
    if (!endTimeValue) {
      return '00:00:00';
    }

    const endTime = new Date(endTimeValue).getTime();
    const diff = endTime - Date.now();

    if (diff <= 0) {
      return '00:00:00';
    }

    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }

  private getRandomVotes(): number {
    return 20 + Math.floor(Math.random() * 81);
  }

  private loadCandidates(): Candidate[] {
    const savedCandidates = this.readCandidatesRaw();
    if (!savedCandidates.length) {
      return this.createDefaultCandidates();
    }

    const looksLikePlaceholderData = savedCandidates.length < 6
      && savedCandidates.every((candidate) =>
        typeof candidate?.name === 'string' && candidate.name.startsWith('Candidate')
      );

    if (looksLikePlaceholderData) {
      return this.createDefaultCandidates();
    }

    return savedCandidates.map((candidate, index) => {
      const fallback = this.candidateSeeds[index % this.candidateSeeds.length];
      return this.normalizeCandidate(candidate, index, fallback);
    });
  }

  private readCandidatesRaw(): Partial<Candidate>[] {
    try {
      const raw = localStorage.getItem('candidates');
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private readCandidates(): Candidate[] {
    return this.loadCandidates();
  }

  private saveCandidates(candidates: Candidate[]): void {
    localStorage.setItem('candidates', JSON.stringify(candidates));
    this.saveVotesSnapshot(candidates);
  }

  private saveVotesSnapshot(candidates: Candidate[]): void {
    localStorage.setItem(
      'votes',
      JSON.stringify(candidates.map(({ id, votes }) => ({ id, votes })))
    );
  }

  private readVotedAadhaars(): string[] {
    return this.readJsonArray('votedAadhaars').filter((value): value is string => typeof value === 'string');
  }

  private readJsonArray(key: string): any[] {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private getCurrentUser(): CurrentUser | null {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || 'null');
    } catch {
      return null;
    }
  }

  private saveCurrentUser(user: CurrentUser): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  private createEmptyState(): ElectionState {
    return {
      candidates: [],
      leadingCandidate: null,
      totalVotes: 0,
      countdown: '00:00:00',
      electionEnded: true,
      electionStatus: 'Closed'
    };
  }
}
