import { MenuItem } from 'primeng/api';
import { DetailOverflowMenuTone } from './detail-page-toolbar.config';

export type QuerySaveShareActionId = 'save-search' | 'share-search';

export type QueryOverflowActionId =
  | 'save-farm'
  | 'send-data'
  | 'edit-search'
  | 'dynamic-stats'
  | 'clear-start-over'
  | 'new-possible-leads';

/** Legacy area-search result actions shown in the overflow (three-dot) menu. */
export const DETAIL_QUERY_OVERFLOW_MENU_ACTIONS: Array<{
  id: QueryOverflowActionId;
  label: string;
  menuTone?: DetailOverflowMenuTone | 'danger';
}> = [
  { id: 'save-farm', label: 'Save Farm' },
  { id: 'send-data', label: 'Send Data' },
  { id: 'edit-search', label: 'Edit Search' },
  { id: 'dynamic-stats', label: 'Dynamic Stats' },
  { id: 'clear-start-over', label: 'Clear / Start Over', menuTone: 'danger' },
  { id: 'new-possible-leads', label: 'New Possible Leads', menuTone: 'success-light' }
];

export function buildQuerySaveShareMenuItems(
  onAction: (actionId: QuerySaveShareActionId) => void
): MenuItem[] {
  return [
    { label: 'Save Search', command: () => onAction('save-search') },
    { label: 'Share', command: () => onAction('share-search') }
  ];
}

function queryOverflowMenuItemClass(tone?: DetailOverflowMenuTone | 'danger'): string | undefined {
  if (tone === 'danger') {
    return 'detail-overflow-menu-item--danger';
  }

  if (tone === 'success-light') {
    return 'detail-overflow-menu-item--success-light';
  }

  return undefined;
}

export function buildQueryOverflowMenuItems(
  onAction: (actionId: QueryOverflowActionId) => void
): MenuItem[] {
  return DETAIL_QUERY_OVERFLOW_MENU_ACTIONS.map((action) => ({
    label: action.label,
    styleClass: queryOverflowMenuItemClass(action.menuTone),
    command: () => onAction(action.id)
  }));
}
