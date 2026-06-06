import { Component, Input, computed, signal, OnChanges, SimpleChanges } from '@angular/core';
import {
  DataTableColumn,
  DataTableColumnAlign,
  DataTableSortDirection,
  DataTableSortType
} from './data-table.types';

@Component({
  selector: 'app-data-table',
  standalone: true,
  templateUrl: './data-table.component.html'
})
export class DataTableComponent implements OnChanges {
  @Input({ required: true }) columns: DataTableColumn[] = [];
  @Input({ required: true }) rows: Record<string, unknown>[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() emptyMessage = 'No records found.';
  @Input() paginated = true;
  @Input() pageSize = 10;

  readonly currentPage = signal(1);
  readonly sortKey = signal<string | null>(null);
  readonly sortDirection = signal<DataTableSortDirection>('asc');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rows']) {
      this.currentPage.set(1);
      this.sortKey.set(null);
      this.sortDirection.set('asc');
    }
  }

  readonly sortedRows = computed(() => {
    const key = this.sortKey();
    if (!key) {
      return this.rows;
    }

    const column = this.columns.find(col => col.key === key);
    const direction = this.sortDirection();
    const sorted = [...this.rows];

    sorted.sort((left, right) => {
      const result = this.compareValues(left[key], right[key], column);
      return direction === 'asc' ? result : -result;
    });

    return sorted;
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.sortedRows().length / this.pageSize)));

  readonly visibleRows = computed(() => {
    const data = this.sortedRows();

    if (!this.paginated) {
      return data;
    }

    const start = (this.currentPage() - 1) * this.pageSize;
    return data.slice(start, start + this.pageSize);
  });

  pageStart(): number {
    const total = this.sortedRows().length;
    if (!total) {
      return 0;
    }

    return (this.currentPage() - 1) * this.pageSize + 1;
  }

  pageEnd(): number {
    return Math.min(this.currentPage() * this.pageSize, this.sortedRows().length);
  }

  goToPage(page: number): void {
    const next = Math.min(Math.max(page, 1), this.totalPages());
    this.currentPage.set(next);
  }

  toggleSort(column: DataTableColumn): void {
    if (!this.isSortable(column)) {
      return;
    }

    if (this.sortKey() === column.key) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(column.key);
      this.sortDirection.set('asc');
    }

    this.currentPage.set(1);
  }

  isSortable(column: DataTableColumn): boolean {
    return column.sortable !== false;
  }

  isSorted(column: DataTableColumn): boolean {
    return this.sortKey() === column.key;
  }

  sortIconClass(column: DataTableColumn): string {
    const base = 'pi text-[0.65rem] shrink-0';

    if (!this.isSorted(column)) {
      return `${base} pi-sort-alt text-subtle/80`;
    }

    return this.sortDirection() === 'asc'
      ? `${base} pi-sort-up-fill text-primary`
      : `${base} pi-sort-down-fill text-primary`;
  }

  sortAriaLabel(column: DataTableColumn): string {
    if (!this.isSorted(column)) {
      return `Sort by ${column.label}`;
    }

    const direction = this.sortDirection() === 'asc' ? 'ascending' : 'descending';
    return `Sort by ${column.label}, currently ${direction}. Activate to reverse.`;
  }

  formatCell(value: unknown): string {
    if (value == null || value === '') {
      return '—';
    }

    return String(value);
  }

  trackRow(index: number, row: Record<string, unknown>): string {
    const id = row['id'] ?? row['purchaseId'] ?? row['tx_id'];
    return id != null ? String(id) : String(index);
  }

  headerAlignClass(column: DataTableColumn, index: number): string {
    if (index === 0) {
      return 'text-left';
    }

    return this.alignClass(column.align ?? 'left');
  }

  cellAlignClass(column: DataTableColumn, index: number): string {
    if (index === 0) {
      return 'text-left';
    }

    return this.alignClass(column.align ?? (column.variant === 'numeric' ? 'right' : 'left'));
  }

  headerClasses(column: DataTableColumn, index: number, isLast: boolean): string {
    const classes = [
      'bg-sidebar-active px-4 py-3 text-caption font-semibold uppercase tracking-wide text-foreground',
      this.headerAlignClass(column, index)
    ];

    if (this.isSorted(column)) {
      classes.push('bg-primary/10');
    }

    if (column.width) {
      classes.push(column.width);
    }

    if (column.nowrap) {
      classes.push('whitespace-nowrap');
    }

    if (!isLast) {
      classes.push('border-r border-border/60');
    }

    return classes.join(' ');
  }

  headerButtonClasses(column: DataTableColumn, index: number): string {
    const classes = [
      'inline-flex w-full items-center gap-1.5 transition-colors',
      this.headerAlignClass(column, index)
    ];

    if (index === 0) {
      classes.push('justify-start');
    } else if (column.align === 'center') {
      classes.push('justify-center');
    } else if (column.align === 'right') {
      classes.push('justify-end');
    } else {
      classes.push('justify-start');
    }

    if (this.isSortable(column)) {
      classes.push('cursor-pointer hover:text-primary');
    }

    return classes.join(' ');
  }

  cellClasses(column: DataTableColumn, index: number, isLast: boolean): string {
    const classes = ['px-4 py-2 text-body-sm text-foreground', this.cellAlignClass(column, index)];

    if (column.width && !column.truncate) {
      classes.push(column.width);
    }

    if (column.truncate) {
      classes.push('max-w-[16rem] xl:max-w-[22rem]');
    }

    if (column.nowrap) {
      classes.push('whitespace-nowrap');
    }

    if (column.variant === 'numeric') {
      classes.push('tabular-nums font-medium');
    }

    if (column.variant === 'muted') {
      classes.push('text-muted');
    }

    if (!isLast) {
      classes.push('border-r border-border/60');
    }

    return classes.join(' ');
  }

  badgeClasses(value: string): string {
    const base = 'inline-flex items-center rounded-full px-2.5 py-1 text-caption font-medium whitespace-nowrap';
    const normalized = value.toLowerCase();
    let tone = 'bg-sidebar-active text-foreground';

    if (normalized.includes('cancel') || normalized.includes('fail') || normalized.includes('denied')) {
      tone = 'bg-danger/10 text-danger';
    } else if (normalized.includes('complete') || normalized.includes('paid') || normalized.includes('success')) {
      tone = 'bg-success/10 text-success';
    } else if (normalized.includes('pending') || normalized.includes('process')) {
      tone = 'bg-warning/10 text-warning';
    }

    return `${base} ${tone}`;
  }

  private compareValues(left: unknown, right: unknown, column?: DataTableColumn): number {
    const sortType = column?.sortType ?? this.inferSortType(column);

    if (sortType === 'number') {
      return this.compareNumbers(left, right);
    }

    if (sortType === 'date') {
      return this.compareDates(left, right);
    }

    return this.compareText(left, right);
  }

  private inferSortType(column?: DataTableColumn): DataTableSortType {
    if (column?.variant === 'numeric') {
      return 'number';
    }

    return 'text';
  }

  private compareText(left: unknown, right: unknown): number {
    const leftText = this.formatCell(left).toLowerCase();
    const rightText = this.formatCell(right).toLowerCase();
    return leftText.localeCompare(rightText, undefined, { numeric: true, sensitivity: 'base' });
  }

  private compareNumbers(left: unknown, right: unknown): number {
    const leftNum = this.toNumber(left);
    const rightNum = this.toNumber(right);

    if (leftNum == null && rightNum == null) {
      return 0;
    }

    if (leftNum == null) {
      return 1;
    }

    if (rightNum == null) {
      return -1;
    }

    return leftNum - rightNum;
  }

  private compareDates(left: unknown, right: unknown): number {
    const leftTime = this.toTimestamp(left);
    const rightTime = this.toTimestamp(right);

    if (leftTime == null && rightTime == null) {
      return 0;
    }

    if (leftTime == null) {
      return 1;
    }

    if (rightTime == null) {
      return -1;
    }

    return leftTime - rightTime;
  }

  private toNumber(value: unknown): number | null {
    if (value == null || value === '' || value === '—' || value === '-') {
      return null;
    }

    const parsed = Number(String(value).replace(/[^0-9.-]+/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toTimestamp(value: unknown): number | null {
    if (value == null || value === '' || value === '—' || value === '-') {
      return null;
    }

    const parsed = Date.parse(String(value));
    return Number.isNaN(parsed) ? null : parsed;
  }

  private alignClass(align: DataTableColumnAlign): string {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  }
}
