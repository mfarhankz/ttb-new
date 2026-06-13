/**
 * Shared UI Components — barrel re-exports from shared/ui and shared/widgets.
 * Import primitives from '@app/shared/components'.
 * Import domain widgets via deep paths under feature folders or shared/widgets.
 */

// Form Components (shared/ui)
export { InputComponent } from '../ui/input/input.component';
export { SelectComponent, type SelectOption } from '../ui/select/select.component';
export { CheckboxComponent } from '../ui/checkbox/checkbox.component';
export { ToggleComponent } from '../ui/toggle/toggle.component';
export { ButtonComponent, type ButtonVariant, type ButtonSize } from '../ui/button/button.component';

// Layout Components
export { CardComponent } from '../ui/card/card.component';
export { TabToolbarComponent } from '../ui/tab-toolbar/tab-toolbar.component';
export { ModalComponent } from '../ui/modal/modal.component';
export { ThemeModalComponent } from '../ui/theme-modal/theme-modal.component';
export { AutocompleteComponent } from '../ui/autocomplete/autocomplete.component';
export { type AutocompleteItem } from '../ui/autocomplete/autocomplete.types';
export { AddressAutocompleteComponent } from '../widgets/address-autocomplete/address-autocomplete.component';

// Feedback Components
export { AlertComponent, type AlertType } from '../ui/alert/alert.component';

// Utility Components
export { LabelComponent } from '../ui/label/label.component';

// Data Display Components
export { DataTableComponent } from '../ui/data-table/data-table.component';
export { type DataTableColumn } from '../ui/data-table/data-table.types';
export { TabNavComponent } from '../ui/tab-nav/tab-nav.component';
export { type TabNavItem } from '../ui/tab-nav/tab-nav.types';
export { MapTablePipelineComponent } from '../../authenticated/map/components/map-table-pipeline/map-table-pipeline.component';
export { MapPipelineViewToggleComponent } from '../../authenticated/map/components/map-table-pipeline/map-pipeline-view-toggle.component';
export {
  type MapPipelineViewMode,
  type MapTablePipelineConfig
} from '../../authenticated/map/components/map-table-pipeline/map-table-pipeline.types';
export { UsageReportTableComponent } from '../ui/usage-report-table/usage-report-table.component';
export { GeographicAreaFieldsComponent } from '../widgets/geographic-area-fields/geographic-area-fields.component';
export {
  type GeographicAreaCityZipControl,
  type GeographicAreaCityZipMode,
  type GeographicAreaFieldsValue,
  type GeographicAreaGroupType,
  type GeographicAreaLayout
} from '../widgets/geographic-area-fields/geographic-area-fields.types';
export { PropertySearchModalComponent } from '../../authenticated/property-search/components/property-search-modal/property-search-modal.component';
