import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  errorMessage = '';
  isHumanChecked = false;

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  isInvalid(controlName: 'email' | 'password'): boolean {
    const control = this.loginForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (!this.isHumanChecked) {
      this.errorMessage = 'Please verify "I am not a robot"';
      return;
    }

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const matchedUser = users.find((user: { email: string; password: string }) =>
      user.email === email && user.password === password
    );

    if (matchedUser) {
      localStorage.setItem('currentUser', JSON.stringify(matchedUser));
      const auditLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
      auditLogs.push({
        action: 'User Login',
        username: matchedUser.name || matchedUser.email || email,
        timestamp: new Date().toLocaleString()
      });
      localStorage.setItem('auditLogs', JSON.stringify(auditLogs));
      this.router.navigate(['/dashboard']);
      return;
    }

    this.errorMessage = 'Invalid credentials';
  }
}
