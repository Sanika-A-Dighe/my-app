import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  styleUrl: './register.component.css',
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private readonly formBuilder = inject(FormBuilder);
  hasVoted = false;
  submitError = '';
  profileImageBase64 = '';

  private generateVoterId(): string {
    return `VOTER${Date.now().toString().slice(-8)}`;
  }

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

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.profileImageBase64 = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.submitError = '';
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const formValue = this.registerForm.getRawValue();
    const existingUser = users.find((user: { aadhaar: string }) => user.aadhaar === formValue.aadhaar);

    if (existingUser) {
      this.submitError = 'User already exists';
      return;
    }

    users.push({
      ...formValue,
      hasVoted: false,
      profileImage: this.profileImageBase64,
      voterId: this.generateVoterId()
    });
    localStorage.setItem('users', JSON.stringify(users));
    this.registerForm.reset();
    this.profileImageBase64 = '';
  }
}
