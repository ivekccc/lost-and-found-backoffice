import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { tap, catchError, EMPTY } from 'rxjs';
import { AuthRequestDto } from '@lost-and-found/api';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export default class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
  });

  error = signal('');
  loading = signal(false);

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.error.set('');
    this.loading.set(true);

    const loginRequest: AuthRequestDto = {
      email: this.loginForm.controls.email.value!,
      password: this.loginForm.controls.password.value!,
    };

    this.authService.login(loginRequest).pipe(
      tap(() => this.router.navigate(['/'])),
      catchError((error) => {
        this.loading.set(false);
        this.error.set(error.error?.message || error.message || 'Login failed');
        return EMPTY;
      }),
    ).subscribe();
  }
}
