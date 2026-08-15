import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, NgClass } from '@angular/common';
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
import { DetailsSkeletonComponent } from '../../../shared/components/details-skeleton/details-skeleton.component';

const REQUIRED_WEIGHTS_SUM = 100;

@Component({
  selector: 'app-matching-config-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    NgClass,
    DatePipe,
    ErrorStateComponent,
    DetailsSkeletonComponent,
  ],
  templateUrl: './matching-config-form.component.html',
})
export class MatchingConfigFormComponent implements OnInit {
  private matchingConfigApi = inject(MatchingConfigApiService);
  private destroyRef = inject(DestroyRef);

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

  /**
   * Recomputed on every keystroke so the sum warning is immediate. Reads the raw value because a
   * control failing its own range validator still holds a number the admin can see and reason about.
   */
  weightsSum = signal(0);
  weightsDifference = signal(0);

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

  submit(): void {
    if (this.form.invalid || this.weightsSum() !== REQUIRED_WEIGHTS_SUM) {
      this.form.markAllAsTouched();
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
