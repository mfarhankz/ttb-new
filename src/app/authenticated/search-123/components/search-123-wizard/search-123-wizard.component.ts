import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Checkbox } from 'primeng/checkbox';
import { InputText } from 'primeng/inputtext';
import { AlertComponent, ButtonComponent } from '@app/shared/components';
import { CommonAreaSearchQuery } from '@app/core/interfaces/area-search-query.interface';
import { Search123FormState } from '@app/authenticated/search-123/services/search-123.service';
import { GeographicAreaFieldsComponent } from '@app/shared/widgets/geographic-area-fields/geographic-area-fields.component';
import { GeographicAreaFieldsValue } from '@app/shared/widgets/geographic-area-fields/geographic-area-fields.types';

@Component({
  selector: 'app-search-123-wizard',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    RouterLink,
    Checkbox,
    InputText,
    AlertComponent,
    ButtonComponent,
    GeographicAreaFieldsComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './search-123-wizard.component.html',
  host: { class: 'block' }
})
export class Search123WizardComponent {
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
  readonly stepDisabled = input(false);

  readonly formChange = output<Search123FormState>();
  readonly querySelect = output<CommonAreaSearchQuery>();
  readonly search = output<void>();
  readonly payNow = output<void>();
  readonly openPremierData = output<void>();

  readonly showCheckMsg = signal(false);
  readonly showQueryMsg = signal(false);

  readonly hasAreaSelection = computed(() => this.form().countyStateCheck);

  readonly stepThreeDisabled = computed(
    () => !this.hasAreaSelection() || !this.selectedQuery() || this.stepDisabled()
  );

  onCountyStateCheckChange(checked: boolean): void {
    this.emitFormPatch({ countyStateCheck: checked });
  }

  onMaxLimitCheckChange(checked: boolean): void {
    this.emitFormPatch({ maxLimitCheck: checked });
  }

  onMaxLimitValueChange(value: string): void {
    const parsed = Number(value);
    this.emitFormPatch({ maxLimitValue: Number.isFinite(parsed) ? parsed : 0 });
  }

  onOmitSavedChange(checked: boolean): void {
    this.emitFormPatch({ omitSavedRecords: checked });
  }

  onGeographicChange(value: GeographicAreaFieldsValue): void {
    this.emitFormPatch({ geographic: value });
  }

  onSearchClick(): void {
    this.showQueryMsg.set(!this.selectedQuery());
    this.showCheckMsg.set(!this.form().countyStateCheck);

    if (!this.hasAreaSelection() || !this.selectedQuery()) {
      return;
    }

    this.search.emit();
  }

  selectQuery(query: CommonAreaSearchQuery): void {
    this.showQueryMsg.set(false);
    this.querySelect.emit(query);
  }

  private emitFormPatch(patch: Partial<Search123FormState>): void {
    this.formChange.emit({ ...this.form(), ...patch });
  }
}
