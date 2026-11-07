import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { EMPTY, catchError, tap } from 'rxjs';
import { MatchingConfigDto, UpdateMatchingConfigRequest } from '@lost-and-found/api';
import { MatchingConfigApiService } from '../../../core/api/matching-config-api.service';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { ToastService } from '../../../shared/services/toast.service';

const REQUIRED_WEIGHTS_SUM = 100;

@Component({
  selector: 'app-matching-config-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    ErrorStateComponent,
  ],
  templateUrl: './matching-config-form.component.html',
})
export class MatchingConfigFormComponent implements OnInit {
  private readonly toastService = inject(ToastService);
  private matchingConfigApi = inject(MatchingConfigApiService);
  private destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  loading = signal(true);
  error = signal(false);
  saving = signal(false);
  updatedAt = signal<string | null>(null);

  form = new FormGroup({
    maxDistanceKm: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0.1),
    ]),
    weightDistance: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(100),
    ]),
    weightText: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(100),
    ]),
    weightTime: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(100),
    ]),
    timeDecayDays: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1),
    ]),
    scoreThreshold: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0),
      Validators.max(100),
    ]),
  });

  weightsSum = signal(0);
  weightsDifference = signal(0);
  private readonly submitted = signal(false);
  protected readonly sumInvalid = computed(() => this.submitted() && this.weightsSum() !== REQUIRED_WEIGHTS_SUM);

  ngOnInit(): void {
    this.form.valueChanges
      .pipe(
        tap(() => this.recomputeWeights()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);

    this.matchingConfigApi
      .get()
      .pipe(
        tap((config) => {
          this.fill(config);
          this.loading.set(false);
        }),
        catchError(() => {
          this.error.set(true);
          this.loading.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected fieldError(name: keyof typeof this.form.controls): string | null {
    const control = this.form.controls[name];
    if (!control.touched || !control.errors) {
      return null;
    }
    if (control.errors['required']) {
      return 'Enter a value.';
    }
    if (control.errors['min']) {
      return `Must be at least ${control.errors['min'].min}.`;
    }
    if (control.errors['max']) {
      return `Must be at most ${control.errors['max'].max}.`;
    }
    return 'Enter a valid number.';
  }

  protected weightInvalid(name: 'weightDistance' | 'weightText' | 'weightTime'): boolean {
    return !!this.fieldError(name) || this.sumInvalid();
  }

  protected weightDescribedBy(name: 'weightDistance' | 'weightText' | 'weightTime'): string | null {
    const ids = [this.fieldError(name) ? `${name}-error` : null, this.sumInvalid() ? 'weights-sum' : null].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  }

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid || this.weightsSum() !== REQUIRED_WEIGHTS_SUM) {
      this.form.markAllAsTouched();
      setTimeout(() => this.host.nativeElement.querySelector<HTMLInputElement>('.is-invalid')?.focus());
      return;
    }

    const value = this.form.getRawValue();
    const request: UpdateMatchingConfigRequest = {
      maxDistanceKm: value.maxDistanceKm!,
      weightDistance: value.weightDistance!,
      weightText: value.weightText!,
      weightTime: value.weightTime!,
      timeDecayDays: value.timeDecayDays!,
      scoreThreshold: value.scoreThreshold!,
    };

    this.saving.set(true);
    this.form.disable({ emitEvent: false });

    this.matchingConfigApi
      .update(request)
      .pipe(
        tap((config) => {
          this.fill(config);
          this.saving.set(false);
          this.toastService.success('Matching parameters saved', { detail: 'They apply to matches computed from now on.' });
        }),
        catchError(() => {
          this.form.enable({ emitEvent: false });
          this.saving.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private fill(config: MatchingConfigDto): void {
    this.form.enable({ emitEvent: false });
    this.form.setValue(
      {
        maxDistanceKm: config.maxDistanceKm,
        weightDistance: config.weightDistance,
        weightText: config.weightText,
        weightTime: config.weightTime,
        timeDecayDays: config.timeDecayDays,
        scoreThreshold: config.scoreThreshold,
      },
      { emitEvent: false },
    );
    this.updatedAt.set(config.updatedAt);
    this.recomputeWeights();
  }

  private recomputeWeights(): void {
    const value = this.form.getRawValue();
    const sum =
      (value.weightDistance ?? 0) + (value.weightText ?? 0) + (value.weightTime ?? 0);
    this.weightsSum.set(sum);
    this.weightsDifference.set(sum - REQUIRED_WEIGHTS_SUM);
  }
}
