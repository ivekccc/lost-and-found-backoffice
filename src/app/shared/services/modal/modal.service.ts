import { Injectable, TemplateRef, Type } from '@angular/core';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  constructor(private bsModalService: BsModalService) {}

  openLeftModal<T>(content: Type<T> | TemplateRef<any>, config?: Partial<ModalOptions<T>>): BsModalRef<T> {
    const leftModalConfig: ModalOptions<T> = {
      ...config,
      class: `bo-modal bo-modal-left ${config?.class || ''}`.trim(),
    } as ModalOptions<T>;

    return this.bsModalService.show(content, leftModalConfig);
  }

  openRightModal<T>(content: Type<T> | TemplateRef<any>, config?: Partial<ModalOptions<T>>): BsModalRef<T> {
    const rightModalConfig: ModalOptions<T> = {
      ...config,
      class: `bo-modal bo-modal-right ${config?.class || ''}`.trim(),
    } as ModalOptions<T>;

    return this.bsModalService.show(content, rightModalConfig);
  }

  openLargeLeftModal<T>(content: Type<T> | TemplateRef<any>, config?: Partial<ModalOptions<T>>): BsModalRef<T> {
    const largeLeftModalConfig: ModalOptions<T> = {
      ...config,
      class: `bo-modal-large bo-modal-left ${config?.class || ''}`.trim(),
    } as ModalOptions<T>;

    return this.bsModalService.show(content, largeLeftModalConfig);
  }

  openLargeRightModal<T>(content: Type<T> | TemplateRef<any>, config?: Partial<ModalOptions<T>>): BsModalRef<T> {
    const largeRightModalConfig: ModalOptions<T> = {
      ...config,
      class: `bo-modal-large bo-modal-right ${config?.class || ''}`.trim(),
    } as ModalOptions<T>;

    return this.bsModalService.show(content, largeRightModalConfig);
  }
}
