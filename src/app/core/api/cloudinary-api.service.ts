import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CloudinarySignatureDto } from '@lost-and-found/api';
import { ApiService } from './api.service';

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

@Injectable({ providedIn: 'root' })
export class CloudinaryApiService {
  constructor(
    private api: ApiService,
    private http: HttpClient,
  ) {}

  getSignature(): Observable<CloudinarySignatureDto> {
    return this.api.get<CloudinarySignatureDto>('cloudinary/signature');
  }

  upload(cloudName: string, formData: FormData): Observable<CloudinaryUploadResult> {
    return this.http.post<CloudinaryUploadResult>(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData,
    );
  }
}
