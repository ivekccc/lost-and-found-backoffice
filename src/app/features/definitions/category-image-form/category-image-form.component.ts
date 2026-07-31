import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { Subject, EMPTY, switchMap, tap, catchError, map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ReportCategoryDto, UpdateCategoryImageRequestDto } from '@lost-and-found/api';
import { CloudinaryApiService } from '../../../core/api/cloudinary-api.service';
import { ReportCategoriesApiService } from '../../../core/api/report-categories-api.service';
import { ConfirmButtonsComponent } from '../../../shared/components/confirm-buttons/confirm-buttons.component';

@Component({
  selector: 'app-category-image-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ConfirmButtonsComponent],
  templateUrl: './category-image-form.component.html',
})
export class CategoryImageFormComponent {
  private cloudinaryApi = inject(CloudinaryApiService);
  private categoriesApi = inject(ReportCategoriesApiService);
  private destroyRef = inject(DestroyRef);

  category!: ReportCategoryDto;
  onSave: Subject<string> = new Subject();

  selectedFile: File | null = null;
  previewUrl = signal<string | null>(null);
  uploading = signal(false);

  constructor(public bsModalRef: BsModalRef) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile = file;
    this.previewUrl.set(file ? URL.createObjectURL(file) : null);
  }

  submit(): void {
    if (!this.selectedFile) {
      return;
    }
    this.uploading.set(true);
    const file = this.selectedFile;

    this.cloudinaryApi
      .getSignature()
      .pipe(
        switchMap((signature) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('signature', signature.signature);
          formData.append('timestamp', String(signature.timestamp));
          formData.append('api_key', signature.apiKey);
          // Server generise i potpisuje publicId vezan za nalog koji trazi potpis; menjanje
          // ove vrednosti obara potpis. Ranije se slao goli folder, pa je ime fajla biralo
          // klijent i otpremljena slika nije imala vlasnika.
          formData.append('public_id', signature.publicId);
          return this.cloudinaryApi.upload(signature.cloudName, formData);
        }),
        switchMap((result) => {
          const request: UpdateCategoryImageRequestDto = {
            imageUrl: result.secure_url,
            imagePublicId: result.public_id,
          };
          return this.categoriesApi
            .updateImage(this.category.id, request)
            .pipe(map(() => result.secure_url));
        }),
        tap((imageUrl) => this.onSave.next(imageUrl)),
        catchError(() => {
          this.uploading.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
