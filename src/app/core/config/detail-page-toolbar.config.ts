import { MenuItem } from 'primeng/api';

export type DetailExportActionId =
  | 'export-farm'
  | 'export-corefact'
  | 'export-facebook'
  | 'export-custom'
  | 'export-avery-labels'
  | 'export-line-pdf'
  | 'export-walking-farm'
  | 'export-print-marketing';

export type DetailToolbarActionId =
  | DetailExportActionId
  | 'send-data'
  | 'dynamic-stats'
  | 'resave-farm'
  | 'premier-data'
  | 'new-possible-leads'
  | 'sell-refi-scores';

export type DetailOverflowMenuTone = 'success-light' | 'success-dark';

export interface DetailToolbarButtonDefinition {
  id: DetailToolbarActionId;
  label: string;
  menuTone?: DetailOverflowMenuTone;
}

/** Legacy farm toolbar actions shown in the overflow (three-dot) menu. */
export const DETAIL_FARM_OVERFLOW_MENU_ACTIONS: DetailToolbarButtonDefinition[] = [
  { id: 'send-data', label: 'Send Data' },
  { id: 'dynamic-stats', label: 'Dynamic Stats' },
  { id: 'resave-farm', label: 'Resave Farm' },
  { id: 'premier-data', label: 'Premier Data' },
  { id: 'new-possible-leads', label: 'New Possible Leads', menuTone: 'success-light' },
  { id: 'sell-refi-scores', label: 'Sell & Refi Scores', menuTone: 'success-dark' }
];

function overflowMenuItemClass(tone?: DetailOverflowMenuTone): string | undefined {
  if (tone === 'success-light') {
    return 'detail-overflow-menu-item--success-light';
  }

  if (tone === 'success-dark') {
    return 'detail-overflow-menu-item--success-dark';
  }

  return undefined;
}

export function buildDetailOverflowMenuItems(
  actions: DetailToolbarButtonDefinition[],
  onAction: (actionId: DetailToolbarActionId) => void
): MenuItem[] {
  return actions.map((action) => ({
    label: action.label,
    styleClass: overflowMenuItemClass(action.menuTone),
    command: () => onAction(action.id)
  }));
}

function sectionHeader(label: string): MenuItem {
  return {
    label,
    disabled: true,
    styleClass: 'font-semibold uppercase text-caption opacity-100'
  };
}

export function buildDetailExportMenuItems(
  onAction: (actionId: DetailExportActionId) => void
): MenuItem[] {
  const run = (actionId: DetailExportActionId): MenuItem['command'] => () => onAction(actionId);

  return [
    sectionHeader('CSV Export'),
    { label: 'Farm', command: run('export-farm') },
    { label: 'Corefact', command: run('export-corefact') },
    {
      label: 'Facebook',
      icon: 'pi pi-facebook',
      command: run('export-facebook')
    },
    { label: 'Custom', command: run('export-custom') },
    { separator: true },
    sectionHeader('Mailing'),
    { label: 'Avery 5160 Labels', command: run('export-avery-labels') },
    { separator: true },
    sectionHeader('Reports'),
    { label: '# -line PDF', command: run('export-line-pdf') },
    { label: 'Walking Farm', command: run('export-walking-farm') },
    { separator: true },
    sectionHeader('External Export'),
    { label: 'Print Marketing', command: run('export-print-marketing') }
  ];
}
