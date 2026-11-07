import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { inject } from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuditAction, AuditEntryDto, AuditTargetType } from '@lost-and-found/api';
import { AuditApiService } from '../../core/api/audit-api.service';
import { DataTableComponent, TableColumn, TableEmptyDirective, TableRowDirective } from '../../shared/components/data-table/data-table.component';
import { SelectComponent } from '../../shared/components/select/select.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { createListQuery } from '../../shared/data/list-query';
import { createPagedLoader } from '../../shared/data/paged-loader';
import { AUDIT_ACTION, AUDIT_TARGET, auditTargetLink } from './audit-presentation';

const FILTERS = ['action', 'targetType', 'targetId', 'actorId'] as const;

@Component({
  selector: 'app-audit-log',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SelectComponent,DataTableComponent, TableRowDirective, TableEmptyDirective, PageHeaderComponent, RelativeTimePipe, DatePipe, JsonPipe, RouterLink],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.scss',
})
export default class AuditLogComponent {
  private readonly auditApi = inject(AuditApiService);

  protected readonly query = createListQuery({ filters: FILTERS, defaultSort: 'createdAt', defaultDirection: 'desc' });
  protected readonly loader = createPagedLoader(this.query.state, (state) =>
    this.auditApi.getEntries({
      page: state.page,
      size: state.size,
      sort: state.sort,
      direction: state.direction,
      action: state.filters.action as AuditAction | undefined,
      targetType: state.filters.targetType as AuditTargetType | undefined,
      targetId: state.filters.targetId ? Number(state.filters.targetId) : undefined,
      actorId: state.filters.actorId ? Number(state.filters.actorId) : undefined,
    }),
  );

  protected readonly expanded = signal<number | null>(null);
  protected readonly actionLabel = AUDIT_ACTION;
  protected readonly targetLabel = AUDIT_TARGET;
  protected readonly targetLink = auditTargetLink;
  protected readonly actionOptions = Object.entries(AUDIT_ACTION).map(([value, label]) => ({ value, label }));
  protected readonly targetOptions = Object.entries(AUDIT_TARGET).map(([value, label]) => ({ value, label }));
  protected readonly filtered = computed(() => this.query.activeFilterCount() > 0);
  protected readonly columns: TableColumn[] = [
    { key: 'createdAt', label: 'When', sortKey: 'createdAt', width: '150px' },
    { key: 'action', label: 'Action', width: '200px' },
    { key: 'summary', label: 'Summary' },
    { key: 'actor', label: 'By', width: '170px' },
    { key: 'details', label: 'Details', hideLabel: true, width: '90px', align: 'end' },
  ];

  protected toggle(entry: AuditEntryDto): void {
    this.expanded.update((current) => (current === entry.id ? null : entry.id));
  }

  protected hasDetails(entry: AuditEntryDto): boolean {
    return !!entry.details && Object.keys(entry.details).length > 0;
  }
}
