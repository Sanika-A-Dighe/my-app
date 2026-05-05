import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
      <div>
        <label for="name">Name</label>
        <input id="name" type="text" formControlName="name" />
        <div *ngIf="isInvalid('name')">Name is required.</div>
      </div>

      <div>
        <label for="email">Email</label>
        <input id="email" type="email" formControlName="email" />
        <div *ngIf="isInvalid('email')">Enter a valid email.</div>
      </div>

      <div>
        <label for="password">Password</label>
        <input id="password" type="password" formControlName="password" />
        <div *ngIf="isInvalid('password')">Password must be at least 6 characters.</div>
      </div>

      <div>
        <label for="aadhaar">Aadhaar</label>
        <input id="aadhaar" type="text" formControlName="aadhaar" maxlength="12" />
        <div *ngIf="isInvalid('aadhaar')">Aadhaar must be exactly 12 digits.</div>
      </div>

      <button type="submit">Register</button>
    </form>
  `
})
export class RegisterComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly registerForm = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    aadhaar: ['', [Validators.required, Validators.pattern(/^\d{12}$/)]]
  });

  isInvalid(controlName: 'name' | 'email' | 'password' | 'aadhaar'): boolean {
    const control = this.registerForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    users.push(this.registerForm.getRawValue());
    localStorage.setItem('users', JSON.stringify(users));
    this.registerForm.reset();
  }
}
