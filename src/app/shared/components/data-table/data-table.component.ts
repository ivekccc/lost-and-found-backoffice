import {
  Component,
  Input,
  Output,
  EventEmitter,
  TemplateRef,
  Directive,
  contentChild,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

@Directive({
  selector: '[dataTableHeaderTemplate]',
})
export class DataTableHeaderTemplateDirective {
  public readonly template = inject(TemplateRef<any>);
}

@Directive({
  selector: '[dataTableRowTemplate]',
})
export class DataTableRowTemplateDirective {
  public readonly template = inject(TemplateRef<any>);
}

@Component({
  selector: 'app-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent {
  readonly headerTemplate = contentChild(DataTableHeaderTemplateDirective, { read: TemplateRef });
  readonly rowTemplate = contentChild(DataTableRowTemplateDirective, { read: TemplateRef });

  @Input() data: any[] = [];
  @Input() headingText = '';
  @Input() buttonText = '';
  @Input() disableAddNew = false;
  @Input() emptyMessage = 'No items found';

  @Output() addNew = new EventEmitter<void>();

  onAddNewData(): void {
    this.addNew.emit();
  }
}
