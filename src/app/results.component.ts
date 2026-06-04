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
import {
  Chart,
  ChartConfiguration,
  ChartData,
  ChartType,
  registerables
} from 'chart.js';

Chart.register(...registerables);

type Candidate = {
  id: number;
  name: string;
  party: string;
  votes: number;
};

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

  @ViewChild('pieChartCanvas') pieChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChartCanvas') barChartCanvas?: ElementRef<HTMLCanvasElement>;

  candidates: Candidate[] = [];
  totalVotes = 0;
  candidateResults: CandidateResult[] = [];
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private pieChart: Chart<'pie'> | null = null;
  private barChart: Chart<'bar'> | null = null;
  private viewReady = false;

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadResults();
    this.refreshTimer = setInterval(() => {
      this.loadResults();
      this.renderCharts();
    }, 1000);
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderCharts();
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    this.destroyCharts();
  }

  private loadResults(): void {
    const savedCandidates = JSON.parse(localStorage.getItem('candidates') || '[]');
    this.candidates = Array.isArray(savedCandidates) ? savedCandidates : [];

    this.totalVotes = this.candidates.reduce((sum, candidate) => sum + candidate.votes, 0);
    this.candidateResults = this.candidates.map((candidate) => ({
      ...candidate,
      percentage: this.totalVotes > 0 ? (candidate.votes / this.totalVotes) * 100 : 0
    }));
  }

  private renderCharts(): void {
    if (!this.isBrowser || !this.viewReady || !this.pieChartCanvas || !this.barChartCanvas) {
      return;
    }

    const labels = this.candidateResults.map((candidate) => candidate.name);
    const votes = this.candidateResults.map((candidate) => candidate.votes);
    const colors = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

    this.destroyCharts();

    const pieConfig: ChartConfiguration<'pie', number[], string> = {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            data: votes,
            backgroundColor: labels.map((_, index) => colors[index % colors.length]),
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
            backgroundColor: '#2563eb',
            borderRadius: 8
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

    this.pieChart = new Chart(this.pieChartCanvas.nativeElement, pieConfig);
    this.barChart = new Chart(this.barChartCanvas.nativeElement, barConfig);
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
  }
}
