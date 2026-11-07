import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, catchError, finalize, tap } from 'rxjs';
import { AuthRequestDto } from '@lost-and-found/api';
import { AuthService } from '../../core/services/auth.service';
import { describeHttpError } from '../../core/utils/http-error';
import { safeReturnUrl } from '../../core/utils/return-url';
import { LoginBackdropComponent } from './login-backdrop.component';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, LoginBackdropComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export default class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly loginForm = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  protected readonly error = signal('');
  protected readonly loading = signal(false);
  protected readonly passwordVisible = signal(false);
  protected readonly capsLock = signal(false);

  protected trackCapsLock(event: KeyboardEvent): void {
    if (typeof event.getModifierState === 'function') {
      this.capsLock.set(event.getModifierState('CapsLock'));
    }
  }

  protected onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      const firstInvalid = document.querySelector<HTMLInputElement>('.login__form input.ng-invalid');
      firstInvalid?.focus();
      return;
    }

    this.error.set('');
    this.loading.set(true);
    const request: AuthRequestDto = this.loginForm.getRawValue();

    this.authService
      .login(request)
      .pipe(
        tap(() => this.router.navigateByUrl(safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl')))),
        finalize(() => this.loading.set(false)),
        catchError((error: unknown) => {
          this.error.set(this.describe(error));
          return EMPTY;
        }),
      )
      .subscribe();
  }

  private describe(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401 || error.status === 400) {
        return 'The email or password is not correct.';
      }
      if (error.status === 429) {
        return typeof error.error?.message === 'string' ? error.error.message : 'Too many attempts. Try again in a few minutes.';
      }
      return describeHttpError(error).title;
    }
    return error instanceof Error ? error.message : 'Sign-in failed. Try again.';
  }
}
