import { FormsModule } from '@angular/forms';
import {
  Component,
  HostListener,
  Input,
  computed,
  effect,
  input,
  output,
  signal,
  untracked
} from '@angular/core';
import {
  DataTableBadgeCell,
  DataTableColumn,
  DataTableLeadDetailItem,
  DataTableColumnAlign,
  DataTableRowAction,
  DataTableSortDirection,
  DataTableSortType
} from './data-table.types';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './data-table.component.html',
  styles: [
    `
      .pipeline-score__content {
        display: inline-flex;
        align-items: center;
        gap: 0.3125rem;
        min-width: 8.125rem;
      }

      .pipeline-score__bar {
        display: inline-flex;
        align-items: center;
        gap: 0.1875rem;
      }

      .pipeline-score__pill {
        display: inline-block;
        flex-shrink: 0;
        width: 0.625rem;
        height: 0.4375rem;
        border-radius: 0.25rem;
        opacity: 0.2;
      }

      .pipeline-score__pill.is-filled {
        opacity: 1;
      }

      .pipeline-score__pill--tier-1 {
        background-color: #e83030;
      }

      .pipeline-score__pill--tier-2 {
        background-color: #f9851f;
      }

      .pipeline-score__pill--tier-3 {
        background-color: #ffd500;
      }

      .pipeline-score__pill--tier-4 {
        background-color: #afdf20;
      }

      .pipeline-score__pill--tier-5 {
        background-color: #21c45d;
      }

      .pipeline-score__value {
        min-width: 2.5rem;
        text-align: right;
        font-weight: 600;
      }
    `
  ],
  host: {
    class: 'block',
    '[class.flex]': 'fillHeight',
    '[class.flex-col]': 'fillHeight',
    '[class.h-full]': 'fillHeight',
    '[class.min-h-0]': 'fillHeight'
  }
})
export class DataTableComponent {
  @Input({ required: true }) columns: DataTableColumn[] = [];
  readonly rows = input.required<Record<string, unknown>[]>();
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() emptyTitle = 'No records found';
  @Input() emptyDescription = 'There is nothing to show right now.';
  /** @deprecated Use emptyTitle and emptyDescription instead. */
  @Input() emptyMessage = '';
  @Input() paginated = true;
  @Input() set pageSize(value: number) {
    if (this.pageSizeUserOverridden()) {
      return;
    }

    this.pageSizeSignal.set(value > 0 ? value : 10);
  }
  /** When set, shows a rows-per-page selector in the footer. */
  @Input() pageSizeOptions: number[] = [];
  /** When true, table stretches to parent height with scrollable body and pinned footer. */
  @Input() fillHeight = false;
  /** When true, shows a checkbox column for bulk row selection. */
  @Input() showSelectionColumn = false;
  /** Place selection checkboxes after the actions column instead of before all columns. */
  @Input() selectionColumnAfterActions = false;
  /** Optional label for a bulk-select control in the actions column header. */
  @Input() actionsHeaderLabel: string | null = null;
  /** Optional icon class for a bulk-select control in the actions column header. */
  @Input() actionsHeaderIcon: string | null = null;
  @Input() actionsHeaderDisabled = false;
  /** Optional secondary row action icon shown beside the gear menu (e.g. notes). */
  @Input() showSecondaryRowAction = false;
  @Input() secondaryRowActionIcon = 'pi pi-file-o';
  @Input() secondaryRowActionLabel = 'Open notes';
  /** Selected row ids (from {@link trackRow}). */
  readonly selectedRowIds = input<ReadonlySet<string>>(new Set<string>());

  readonly pageSizeSignal = signal(10);
  private readonly pageSizeUserOverridden = signal(false);

  readonly rowAction = output<{ actionId: string; row: Record<string, unknown> }>();
  readonly secondaryRowActionClick = output<{ row: Record<string, unknown> }>();
  readonly actionsHeaderClick = output<void>();
  readonly selectionChange = output<{ rowId: string; selected: boolean }>();
  readonly selectAllChange = output<{ rowIds: string[]; selected: boolean }>();
  readonly rowEnter = output<Record<string, unknown>>();
  readonly rowLeave = output<Record<string, unknown>>();
  readonly rowClick = output<Record<string, unknown>>();

  readonly openActionsRowId = signal<string | null>(null);
  readonly openActionsRow = signal<Record<string, unknown> | null>(null);
  readonly actionsMenuPosition = signal<{ top: number; left: number } | null>(null);

  private readonly actionsMenuEstimatedItemHeight = 32;
  private readonly actionsMenuVerticalGap = 4;

  resolvedEmptyTitle(): string {
    if (this.emptyTitle !== 'No records found') {
      return this.emptyTitle;
    }

    return this.emptyMessage || this.emptyTitle;
  }

  resolvedEmptyDescription(): string {
    if (this.emptyDescription !== 'There is nothing to show right now.') {
      return this.emptyDescription;
    }

    return this.emptyMessage ? '' : this.emptyDescription;
  }

  readonly currentPage = signal(1);
  readonly sortKey = signal<string | null>(null);
  readonly sortDirection = signal<DataTableSortDirection>('asc');

  constructor() {
    effect(() => {
      this.rows();
      untracked(() => {
        this.currentPage.set(1);
        this.sortKey.set(null);
        this.sortDirection.set('asc');
      });
    });
  }

  readonly sortedRows = computed(() => {
    const key = this.sortKey();
    const rows = this.rows();

    if (!key) {
      return rows;
    }

    const column = this.columns.find(col => col.key === key);
    const direction = this.sortDirection();
    const sorted = [...rows];

    const sortField = column?.scoreField ?? key;

    sorted.sort((left, right) => {
      const result = this.compareValues(left[sortField], right[sortField], column);
      return direction === 'asc' ? result : -result;
    });

    return sorted;
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.sortedRows().length / this.pageSizeSignal()))
  );

  readonly visibleRows = computed(() => {
    const data = this.sortedRows();

    if (!this.paginated) {
      return data;
    }

    const start = (this.currentPage() - 1) * this.pageSizeSignal();
    return data.slice(start, start + this.pageSizeSignal());
  });

  pageStart(): number {
    const total = this.sortedRows().length;
    if (!total) {
      return 0;
    }

    return (this.currentPage() - 1) * this.pageSizeSignal() + 1;
  }

  pageEnd(): number {
    return Math.min(this.currentPage() * this.pageSizeSignal(), this.sortedRows().length);
  }

  goToPage(page: number): void {
    const next = Math.min(Math.max(page, 1), this.totalPages());
    this.currentPage.set(next);
  }

  onPageSizeChange(value: number | string): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }

    this.pageSizeUserOverridden.set(true);
    this.pageSizeSignal.set(parsed);
    this.currentPage.set(1);
  }

  showPageSizeSelector(): boolean {
    return this.pageSizeOptions.length > 0;
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
    const base = 'pi shrink-0 !text-[0.875rem]';

    if (!this.isSorted(column)) {
      return `${base} pi-sort-alt text-subtle/80`;
    }

    const family = this.resolveSortIconFamily(column);
    const direction = this.sortDirection() === 'asc' ? 'up' : 'down';

    return `${base} pi-sort-${family}-${direction} text-primary`;
  }

  /** Maps column sort type to PrimeIcons sort family (alpha, numeric, amount). */
  private resolveSortIconFamily(column: DataTableColumn): 'alpha' | 'numeric' | 'amount' {
    const sortType = column.sortType ?? this.inferSortType(column);

    if (sortType === 'number') {
      return 'numeric';
    }

    if (sortType === 'date') {
      return 'amount';
    }

    return 'alpha';
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
      'bg-sidebar-active px-4 py-3 text-caption font-semibold uppercase tracking-wide text-foreground whitespace-nowrap',
      this.headerAlignClass(column, index)
    ];

    if (this.isSorted(column)) {
      classes.push('bg-primary/10');
    }

    if (column.width) {
      classes.push(column.width);
    }

    if (!isLast) {
      classes.push('border-r border-border/60');
    }

    return classes.join(' ');
  }

  headerButtonClasses(column: DataTableColumn, index: number): string {
    const classes = [
      'inline-flex w-full items-center gap-1.5 whitespace-nowrap transition-colors',
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

  badgesContainerClasses(column: DataTableColumn): string {
    if (column.badgesLayout === 'stacked') {
      return 'flex flex-col items-start gap-1';
    }

    return 'flex flex-wrap items-center gap-1.5';
  }

  textBadgeClasses(column: DataTableColumn): string {
    const classes = ['font-medium text-foreground'];

    if (column.truncate) {
      classes.push('max-w-[16rem] truncate xl:max-w-[22rem]');
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

    if (column.variant === 'leadDetails') {
      classes.push('align-top', 'whitespace-normal', 'min-w-[600px]');
    }

    if (column.variant === 'mapPin') {
      classes.push('text-center');
    }

    if (column.variant === 'score') {
      classes.push('whitespace-nowrap');
    }

    if (!isLast) {
      classes.push('border-r border-border/60');
    }

    return classes.join(' ');
  }

  @HostListener('document:click')
  @HostListener('window:resize')
  @HostListener('window:scroll')
  closeActionsMenu(): void {
    this.openActionsRowId.set(null);
    this.openActionsRow.set(null);
    this.actionsMenuPosition.set(null);
  }

  rowStatusIndicator(row: Record<string, unknown>): { tooltip: string } | null {
    const indicator = row['statusIndicator'];
    if (!indicator || typeof indicator !== 'object' || !('tooltip' in indicator)) {
      return null;
    }

    const tooltip = (indicator as { tooltip?: unknown }).tooltip;
    return typeof tooltip === 'string' && tooltip.trim() ? { tooltip: tooltip.trim() } : null;
  }

  actionList(value: unknown): DataTableRowAction[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(
      (item): item is DataTableRowAction =>
        !!item && typeof item === 'object' && 'id' in item && 'label' in item
    );
  }

  isActionsMenuOpen(row: Record<string, unknown>, index: number): boolean {
    return this.openActionsRowId() === this.trackRow(index, row);
  }

  toggleActionsMenu(event: MouseEvent, row: Record<string, unknown>, index: number): void {
    event.stopPropagation();
    const rowId = this.trackRow(index, row);
    const isClosing = this.openActionsRowId() === rowId;

    if (isClosing) {
      this.closeActionsMenu();
      return;
    }

    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const actions = this.rowActions(row);
    const menuHeight = Math.max(actions.length, 1) * this.actionsMenuEstimatedItemHeight + 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < menuHeight && rect.top > menuHeight;
    const top = openAbove
      ? rect.top - menuHeight - this.actionsMenuVerticalGap
      : rect.bottom + this.actionsMenuVerticalGap;

    this.openActionsRowId.set(rowId);
    this.openActionsRow.set(row);
    this.actionsMenuPosition.set({
      top: Math.max(8, top),
      left: rect.left
    });
  }

  openRowActions(): DataTableRowAction[] {
    const row = this.openActionsRow();
    return row ? this.rowActions(row) : [];
  }

  private rowActions(row: Record<string, unknown>): DataTableRowAction[] {
    const actionsColumn = this.columns.find((column) => column.variant === 'actions');
    if (!actionsColumn) {
      return [];
    }

    return this.actionList(row[actionsColumn.key]);
  }

  onRowActionClick(event: MouseEvent, action: DataTableRowAction, row: Record<string, unknown>): void {
    event.stopPropagation();
    this.openActionsRowId.set(null);
    this.rowAction.emit({ actionId: action.id, row });
  }

  onSecondaryRowActionClick(event: MouseEvent, row: Record<string, unknown>): void {
    event.stopPropagation();
    this.closeActionsMenu();
    this.secondaryRowActionClick.emit({ row });
  }

  showActionsHeaderControl(): boolean {
    return !!(this.actionsHeaderLabel || this.actionsHeaderIcon);
  }

  onActionsHeaderClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.actionsHeaderDisabled) {
      return;
    }

    this.actionsHeaderClick.emit();
  }

  showLeadingSelectionColumn(): boolean {
    return this.showSelectionColumn && !this.selectionColumnAfterActions;
  }

  showTrailingSelectionAfterActions(column: DataTableColumn): boolean {
    return this.showSelectionColumn && this.selectionColumnAfterActions && column.variant === 'actions';
  }

  isRowSelected(row: Record<string, unknown>, index: number): boolean {
    return this.selectedRowIds().has(this.trackRow(index, row));
  }

  toggleRowSelection(event: Event, row: Record<string, unknown>, index: number): void {
    event.stopPropagation();
    const rowId = this.trackRow(index, row);
    this.selectionChange.emit({ rowId, selected: !this.isRowSelected(row, index) });
  }

  visibleRowIds(): string[] {
    return this.visibleRows().map((row, index) => this.trackRow(index, row));
  }

  isAllVisibleSelected(): boolean {
    const ids = this.visibleRowIds();
    if (!ids.length) {
      return false;
    }

    const selected = this.selectedRowIds();
    return ids.every((id) => selected.has(id));
  }

  isSomeVisibleSelected(): boolean {
    const selected = this.selectedRowIds();
    return this.visibleRowIds().some((id) => selected.has(id));
  }

  toggleSelectAllVisible(event: Event): void {
    event.stopPropagation();
    const rowIds = this.visibleRowIds();
    const selectAll = !this.isAllVisibleSelected();
    this.selectAllChange.emit({ rowIds, selected: selectAll });
  }

  mapPinNumber(row: Record<string, unknown>, column: DataTableColumn): string {
    const value = row[column.key];
    if (value == null || value === '') {
      return '';
    }

    return String(value);
  }

  mapPinClasses(row: Record<string, unknown>): string {
    return row['sa_site_mail_same'] === 'Y' ? 'map-pin map-pin--owner' : 'map-pin';
  }

  readonly scoreSteps = [0, 1, 2, 3, 4] as const;

  scorePercent(row: Record<string, unknown>, column: DataTableColumn): number | null {
    const field = column.scoreField ?? column.key;
    const raw = row[field];

    if (raw === null || raw === undefined || raw === '') {
      return null;
    }

    const score = Number(raw);
    if (!Number.isFinite(score)) {
      return null;
    }

    return Math.max(0, Math.min(100, score));
  }

  scoreBand(score: number): 1 | 2 | 3 | 4 | 5 {
    if (score >= 80) {
      return 5;
    }

    if (score >= 60) {
      return 4;
    }

    if (score >= 40) {
      return 3;
    }

    if (score >= 20) {
      return 2;
    }

    return 1;
  }

  scoreFilledPills(score: number): number {
    return this.scoreBand(score);
  }

  scorePillClasses(score: number, index: number): string {
    const band = this.scoreBand(score);
    const filled = index < this.scoreFilledPills(score);

    return ['pipeline-score__pill', `pipeline-score__pill--tier-${band}`, filled ? 'is-filled' : '']
      .filter(Boolean)
      .join(' ');
  }

  leadDetailItems(value: unknown): DataTableLeadDetailItem[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(
      (item): item is DataTableLeadDetailItem =>
        !!item &&
        typeof item === 'object' &&
        'key' in item &&
        typeof (item as DataTableLeadDetailItem).key === 'string'
    );
  }

  formatLeadDetailKey(key: string): string {
    return key
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  formatLeadDetailValue(value: unknown): string {
    if (value == null || value === '') {
      return '-';
    }

    return String(value);
  }

  badgeList(value: unknown): DataTableBadgeCell[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(
      (item): item is DataTableBadgeCell =>
        !!item && typeof item === 'object' && 'label' in item && typeof (item as DataTableBadgeCell).label === 'string'
    );
  }

  badgeToneClasses(badge: DataTableBadgeCell): string {
    const base = 'inline-flex items-center rounded-full px-2.5 py-1 text-caption font-medium whitespace-nowrap';

    switch (badge.tone) {
      case 'user':
        return `${base} bg-emerald-100 text-emerald-800`;
      case 'info':
      case 'primary':
        return `${base} bg-primary/10 text-primary`;
      case 'warning':
        return `${base} bg-warning/10 text-warning`;
      case 'danger':
        return `${base} bg-danger/10 text-danger`;
      case 'success':
        return `${base} bg-success/10 text-success`;
      case 'assignment':
        return `${base} bg-sidebar-active text-foreground`;
      case 'status':
      case 'muted':
        return `${base} bg-muted/20 text-muted`;
      default:
        return this.badgeClasses(badge.label);
    }
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
    if (column?.variant === 'numeric' || column?.variant === 'score') {
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
