import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

type VoteReceipt = {
  voterName: string;
  voterAadhaar: string;
  candidateName: string;
  partyName: string;
  votedAt: string;
  profileImage: string;
};

@Component({
  selector: 'app-receipt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './receipt.component.html',
  styleUrl: './receipt.component.css'
})
export class ReceiptComponent {
  private readonly currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  private readonly savedReceipt = JSON.parse(localStorage.getItem('voteReceipt') || 'null');

  receipt: VoteReceipt = {
    voterName: this.savedReceipt?.voterName || this.currentUser?.name || 'N/A',
    voterAadhaar: this.maskAadhaar(this.savedReceipt?.voterAadhaar || this.currentUser?.aadhaar || ''),
    candidateName: this.savedReceipt?.candidateName || 'N/A',
    partyName: this.savedReceipt?.partyName || 'N/A',
    votedAt: this.savedReceipt?.votedAt || 'N/A',
    profileImage: this.currentUser?.profileImage || ''
  };

  downloadReceipt(): void {
    window.print();
  }

  private maskAadhaar(aadhaar: string): string {
    if (!aadhaar || aadhaar.length < 4) {
      return 'N/A';
    }
    return `XXXXXXXX${aadhaar.slice(-4)}`;
  }
}
