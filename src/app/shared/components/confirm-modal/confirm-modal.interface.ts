export interface ConfirmModalInitialState {
  title?: string;
  messageContent: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  visibleCloseButton?: boolean;
}
