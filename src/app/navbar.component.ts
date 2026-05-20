import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  isDarkMode = false;

  constructor(private readonly router: Router) {
    if (this.isBrowser) {
      this.isDarkMode = localStorage.getItem('theme') === 'dark';
    }
    this.applyTheme();
  }

  get displayUser(): string {
    if (!this.isBrowser) {
      return 'Guest';
    }
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser) {
      return 'Guest';
    }
    return currentUser.name || currentUser.email || 'User';
  }

  toggleDarkMode(): void {
    if (!this.isBrowser) {
      return;
    }
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
    }
    this.router.navigate(['/login']);
  }

  private applyTheme(): void {
    if (!this.isBrowser) {
      return;
    }
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
}
