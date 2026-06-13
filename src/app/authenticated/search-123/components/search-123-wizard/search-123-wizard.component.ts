import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Checkbox } from 'primeng/checkbox';
import { InputText } from 'primeng/inputtext';
import { AlertComponent, ButtonComponent } from '@app/shared/components';
import { CommonAreaSearchQuery } from '@app/core/interfaces/area-search-query.interface';
import { SEARCH_123_ROUTE, Search123Shape } from '@app/authenticated/search-123/config/search-123.config';
import { Search123FormState } from '@app/authenticated/search-123/services/search-123.service';
import { AreaSearchCriteriaChipsComponent } from '@app/authenticated/farming/components/area-search-fields/area-search-criteria-chips.component';
import { AreaSearchGeometryPreviewComponent } from '@app/authenticated/farming/components/area-search-fields/area-search-geometry-preview.component';
import { MapDrawnGeometry } from '@app/authenticated/map/services/ol-map.service';
import { AreaSearchCriteriaChip } from '@app/core/utils/area-search-criteria.util';
import { GeographicAreaFieldsComponent } from '@app/shared/widgets/geographic-area-fields/geographic-area-fields.component';
import { GeographicAreaFieldsValue } from '@app/shared/widgets/geographic-area-fields/geographic-area-fields.types';

@Component({
  selector: 'app-search-123-wizard',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    Checkbox,
    InputText,
    AlertComponent,
    ButtonComponent,
    GeographicAreaFieldsComponent,
    AreaSearchCriteriaChipsComponent,
    AreaSearchGeometryPreviewComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search-123-wizard.component.html',
  host: { class: 'block' }
})
export class Search123WizardComponent {
  @ViewChild('geometryPreview') private geometryPreview?: AreaSearchGeometryPreviewComponent;

  private readonly router = inject(Router);

  readonly form = input.required<Search123FormState>();
  readonly queries = input<CommonAreaSearchQuery[]>([]);
  readonly queriesLoading = input(false);
  readonly selectedQuery = input<CommonAreaSearchQuery | null>(null);
  readonly searching = input(false);
  readonly paying = input(false);
  readonly errorMessage = input<string | null>(null);
  readonly successMessage = input<string | null>(null);
  readonly showPayNowButton = input(false);
  readonly payNowPrice = input<number | null>(null);
  readonly premierDataEnabled = input(false);
  readonly allowedMaxLimit = input(10000);
  readonly stepThreeDisabled = input(false);
  readonly selectedShape = input<Search123Shape | null>(null);
  readonly geometry = input<MapDrawnGeometry | null>(null);

  readonly formChange = output<Search123FormState>();
  readonly querySelect = output<CommonAreaSearchQuery>();
  readonly search = output<void>();
  readonly payNow = output<void>();
  readonly openPremierData = output<void>();
  readonly clearDrawnArea = output<void>();

  readonly showAreaMsg = signal(false);
  readonly showQueryMsg = signal(false);

  readonly hasAreaSelection = computed(() => this.form().countyStateCheck || !!this.selectedShape());

  readonly geometryChip = computed((): AreaSearchCriteriaChip[] => {
    if (!this.selectedShape() || !this.geometry()) {
      return [];
    }

    return [
      {
        fieldName: 'geometry',
        label: 'Geometry Type',
        displayValue: this.selectedShape() === 'circle' ? 'Radius' : 'Boundary',
        viewable: true
      }
    ];
  });

  readonly launchDisabled = computed(
    () => this.stepThreeDisabled() || !this.hasAreaSelection() || !this.selectedQuery()
  );

  onCountyStateCheckChange(checked: boolean): void {
    this.patchForm({ countyStateCheck: checked });
  }

  onMaxLimitCheckChange(checked: boolean): void {
    this.patchForm({ maxLimitCheck: checked });
  }

  onMaxLimitValueChange(value: string): void {
    const parsed = Number(value);
    this.patchForm({ maxLimitValue: Number.isFinite(parsed) ? parsed : 0 });
  }

  onOmitSavedChange(checked: boolean): void {
    this.patchForm({ omitSavedRecords: checked });
  }

  onGeographicChange(value: GeographicAreaFieldsValue): void {
    this.patchForm({ geographic: value });
  }

  onSearchClick(): void {
    this.showQueryMsg.set(!this.selectedQuery());
    this.showAreaMsg.set(!this.hasAreaSelection());

    if (this.launchDisabled()) {
      return;
    }

    this.search.emit();
  }

  selectQuery(query: CommonAreaSearchQuery): void {
    this.showQueryMsg.set(false);
    this.querySelect.emit(query);
  }

  goToMapSearch(mode: 'radius' | 'boundary'): void {
    const route = mode === 'radius' ? '/farming/radius-search' : '/farming/boundary-search';
    void this.router.navigate([route], { queryParams: { returnUrl: SEARCH_123_ROUTE } });
  }

  viewGeometry(): void {
    const geometry = this.geometry();
    if (!geometry?.match || geometry.value == null) {
      return;
    }

    this.geometryPreview?.open({ match: geometry.match, value: geometry.value });
  }

  private patchForm(patch: Partial<Search123FormState>): void {
    this.formChange.emit({ ...this.form(), ...patch });
  }
}
