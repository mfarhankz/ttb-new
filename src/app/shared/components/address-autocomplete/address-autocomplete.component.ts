import { Component, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { finalize } from 'rxjs';
import { SMARTY_CONFIG } from '@app/core/config/smarty.config';
import { SmartyAddressDetails, SmartyAutocompleteSuggestion } from '@app/core/interfaces/smarty.interface';
import { SmartyService } from '@app/core/services/smarty.service';
import { extractUnitFromAddressQuery } from '@app/core/utils/address-format.util';
import { AutocompleteComponent } from '@app/shared/components/autocomplete/autocomplete.component';
import { AutocompleteItem } from '@app/shared/components/autocomplete/autocomplete.types';

@Component({
  selector: 'app-address-autocomplete',
  standalone: true,
  imports: [AutocompleteComponent],
  templateUrl: './address-autocomplete.component.html',
  host: {
    class: 'block'
  }
})
export class AddressAutocompleteComponent {
  private readonly smartyService = inject(SmartyService);

  private readonly autocomplete = viewChild.required(AutocompleteComponent);

  readonly inputId = input('address-autocomplete');
  readonly label = input('');
  readonly placeholder = input('Search for an address...');
  readonly size = input<'small' | 'large'>('small');
  readonly disabled = input(false);
  readonly enableVerification = input(false);
  readonly resetToken = input(0);
  readonly appendTo = input<'self' | 'body'>('body');

  readonly placeChanged = output<SmartyAddressDetails>();
  readonly addressStringChange = output<{ query: string; unit?: string }>();

  readonly items = signal<AutocompleteItem<SmartyAutocompleteSuggestion>[]>([]);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly noMatch = signal(false);

  private debounceTimer?: ReturnType<typeof setTimeout>;
  private pendingSecondarySuggestion?: SmartyAutocompleteSuggestion;

  constructor() {
    effect(() => {
      this.resetToken();
      this.items.set([]);
      this.loading.set(false);
      this.error.set(false);
      this.noMatch.set(false);
      this.pendingSecondarySuggestion = undefined;
      this.autocomplete()?.reset();
    });
  }

  onQueryChange(value: string): void {
    this.addressStringChange.emit({
      query: value,
      unit: value ? extractUnitFromAddressQuery(value) : undefined
    });
    this.fetchSuggestions(value);
  }

  onItemSelect(item: AutocompleteItem<SmartyAutocompleteSuggestion>): void {
    const suggestion = item.value;

    if (suggestion.entries > 1) {
      const prefix = suggestion.fullAddress?.split('..')[0] ?? '';
      this.autocomplete().reset(`${prefix} `);
      this.pendingSecondarySuggestion = suggestion;
      this.fetchSuggestions(`${prefix} `, suggestion);
      return;
    }

    this.items.set([]);
    this.pendingSecondarySuggestion = undefined;

    const smartyResult = this.smartyService.toSmartyUSAddressResponse(suggestion);
    let details = this.smartyService.applySmartyAddress(smartyResult);

    if (!details.smarty_delivery_point_barcode) {
      details = this.smartyService.cleanSkippedVerificationResponse(details);
    }

    const finalizeSelection = (resolved: SmartyAddressDetails): void => {
      this.placeChanged.emit(resolved);
    };

    const selectedAddress = suggestion.fullAddress ?? '';

    if (this.enableVerification()) {
      this.smartyService.validateAddress(selectedAddress).subscribe({
        next: (result) => {
          if (result[0]) {
            details = this.smartyService.applySmartyAddress(result[0]);
          }
          finalizeSelection(details);
        },
        error: () => finalizeSelection(details)
      });
      return;
    }

    finalizeSelection(details);
  }

  private fetchSuggestions(query: string, secondarySuggestion?: SmartyAutocompleteSuggestion): void {
    this.error.set(false);
    this.noMatch.set(false);

    if (!query || query.length < SMARTY_CONFIG.minSearchLength) {
      this.items.set([]);
      return;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      const selected = (secondarySuggestion ?? this.pendingSecondarySuggestion)?.fullAddressSelection;
      this.loading.set(true);

      this.smartyService
        .getSuggestions(query, selected)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (results) => {
            this.pendingSecondarySuggestion = undefined;
            this.items.set(this.toAutocompleteItems(results));
            this.noMatch.set(results.length === 0);
          },
          error: () => {
            this.pendingSecondarySuggestion = undefined;
            this.error.set(true);
            this.items.set([]);
          }
        });
    }, SMARTY_CONFIG.debounceMs);
  }

  private toAutocompleteItems(
    suggestions: SmartyAutocompleteSuggestion[]
  ): AutocompleteItem<SmartyAutocompleteSuggestion>[] {
    return suggestions.map((suggestion, index) => ({
      id: `${suggestion.fullAddress ?? 'suggestion'}-${index}`,
      label: suggestion.fullAddress ?? '',
      value: suggestion,
      hint: suggestion.entries > 1 ? `+ ${suggestion.entries} address >` : undefined
    }));
  }
}
