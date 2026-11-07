import { Injectable, inject } from '@angular/core';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { CommandPaletteComponent } from './command-palette.component';

@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
  private readonly dialog = inject(Dialog);
  private readonly overlay = inject(Overlay);
  private dialogRef: DialogRef<unknown, CommandPaletteComponent> | null = null;

  open(): void {
    if (this.dialogRef) {
      return;
    }
    this.dialogRef = this.dialog.open(CommandPaletteComponent, {
      ariaLabel: 'Search or jump to',
      positionStrategy: this.overlay.position().global().centerHorizontally().top('12vh'),
      backdropClass: 'command-palette-backdrop',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
    this.dialogRef.closed.subscribe(() => (this.dialogRef = null));
  }

  toggle(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
      return;
    }
    this.open();
  }
}
