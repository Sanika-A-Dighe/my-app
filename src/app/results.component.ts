import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  inject
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Candidate, ElectionService } from './election.service';

Chart.register(...registerables);

type CandidateResult = Candidate & {
  percentage: number;
};

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results.component.html',
  styleUrl: './results.component.css'
})
export class ResultsComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly electionService = inject(ElectionService);
  private readonly colors = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  @ViewChild('pieChartCanvas') pieChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChartCanvas') barChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChartCanvas') lineChartCanvas?: ElementRef<HTMLCanvasElement>;

  candidateResults: CandidateResult[] = [];
  leadingCandidateName = 'N/A';
  totalVotes = 0;
  totalCandidates = 0;

  private stateSubscription: Subscription | null = null;
  private pieChart: Chart<'pie'> | null = null;
  private barChart: Chart<'bar'> | null = null;
  private lineChart: Chart<'line'> | null = null;
  private viewReady = false;
  private lastSignature = '';

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.electionService.initialize();
    this.stateSubscription = this.electionService.state$.subscribe((state) => {
      this.totalVotes = state.totalVotes;
      this.leadingCandidateName = state.leadingCandidate?.name || 'N/A';
      this.totalCandidates = state.candidates.length;
      this.candidateResults = this.buildResults(state.candidates);
      this.renderCharts();
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderCharts();
  }

  ngOnDestroy(): void {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
      this.stateSubscription = null;
    }

    this.destroyCharts();
  }

  private buildResults(candidates: Candidate[]): CandidateResult[] {
    const totalVotes = candidates.reduce((sum, candidate) => sum + (Number(candidate.votes) || 0), 0);

    return candidates.map((candidate) => ({
      ...candidate,
      percentage: totalVotes > 0 ? ((Number(candidate.votes) || 0) / totalVotes) * 100 : 0
    }));
  }

  private renderCharts(): void {
    if (!this.isBrowser || !this.viewReady || !this.pieChartCanvas || !this.barChartCanvas || !this.lineChartCanvas) {
      return;
    }

    const signature = JSON.stringify(
      this.candidateResults.map((candidate) => ({
        id: candidate.id,
        votes: candidate.votes
      }))
    );

    if (signature === this.lastSignature && this.pieChart && this.barChart && this.lineChart) {
      return;
    }

    this.lastSignature = signature;

    const labels = this.candidateResults.map((candidate) => candidate.name);
    const votes = this.candidateResults.map((candidate) => candidate.votes);
    const dataColors = labels.map((_, index) => this.colors[index % this.colors.length]);

    this.destroyCharts();

    const pieConfig: ChartConfiguration<'pie', number[], string> = {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            data: votes,
            backgroundColor: dataColors,
            borderColor: '#ffffff',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    };

    const barConfig: ChartConfiguration<'bar', number[], string> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Votes',
            data: votes,
            backgroundColor: dataColors,
            borderRadius: 10
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    };

    const lineConfig: ChartConfiguration<'line', number[], string> = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Votes',
            data: votes,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.12)',
            pointBackgroundColor: dataColors,
            pointRadius: 5,
            tension: 0.35,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    };

    this.pieChart = new Chart(this.pieChartCanvas.nativeElement, pieConfig);
    this.barChart = new Chart(this.barChartCanvas.nativeElement, barConfig);
    this.lineChart = new Chart(this.lineChartCanvas.nativeElement, lineConfig);
  }

  private destroyCharts(): void {
    if (this.pieChart) {
      this.pieChart.destroy();
      this.pieChart = null;
    }

    if (this.barChart) {
      this.barChart.destroy();
      this.barChart = null;
    }

    if (this.lineChart) {
      this.lineChart.destroy();
      this.lineChart = null;
    }
  }
}
