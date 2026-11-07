import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Toast, ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss',
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);

  protected icon(toast: Toast): string {
    switch (toast.tone) {
      case 'success':
        return 'fa-circle-check';
      case 'error':
        return 'fa-circle-exclamation';
      default:
        return 'fa-circle-info';
    }
  }

  protected runAction(toast: Toast): void {
    toast.action?.run();
    this.toastService.dismiss(toast.id);
  }
}
