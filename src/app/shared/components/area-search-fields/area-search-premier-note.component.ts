import { Component, ViewChild, computed, inject, input } from '@angular/core';
import { Accordion, AccordionContent, AccordionHeader, AccordionPanel } from 'primeng/accordion';
import { ModalComponent } from '@app/shared/components/modal/modal.component';
import { AreaSearchFieldsService } from '@app/core/services/area-search-fields.service';
import { AreaSearchAccordionStateService } from '@app/core/services/area-search-accordion-state.service';
import { VerticalService } from '@app/core/services/vertical.service';
import { buildAreaSearchPremierNote } from '@app/core/utils/area-search-premier-note.util';
import { AreaSearchControlStyles } from './area-search-control.styles';

@Component({
  selector: 'app-area-search-premier-note',
  standalone: true,
  imports: [Accordion, AccordionPanel, AccordionHeader, AccordionContent, ModalComponent],
  host: {
    class: 'block mb-6'
  },
  template: `
    @if (note(); as premierNote) {
      <div [class]="controlStyles.contactPricingAccordion">
        <p-accordion
          [multiple]="false"
          [value]="accordionState.panelValue('premier-note')"
          (valueChange)="accordionState.onPanelChange('premier-note', $event)"
        >
          <p-accordion-panel value="premier-note">
            <p-accordion-header>Please Note</p-accordion-header>
            <p-accordion-content>
              @if (premierNote.groupId === 4) {
                <p class="text-body-sm leading-relaxed text-foreground">
                  Mortgage and valuation records are available for purchase at
                  <strong class="font-semibold">{{ premierNote.mortgageCents }} cents</strong> per record.
                  Records are acquired by credit card purchase and will be saved to your Title Toolbox account when the
                  purchase is completed. ( To view a sample of the exported data,
                  <button type="button" class="text-primary underline hover:no-underline" (click)="openSampleModal()">
                    Please Click Here
                  </button>
                  )
                </p>
              } @else {
                <p class="text-body-sm leading-relaxed text-foreground">
                  “Life Event” leads are available for purchase at
                  <strong class="font-semibold">{{ premierNote.leadsMinCents }} cents</strong> to
                  <strong class="font-semibold">{{ premierNote.leadsMaxCents }} cents</strong> per record.
                  ( <button type="button" class="text-primary underline hover:no-underline" (click)="openPriceModal()">
                    Click here for full price list
                  </button>
                  )
                  The price per lead will vary based upon the lead type selected. The price of leads will be provided
                  prior to purchase. Leads are acquired by credit card purchase and will be saved to your Title Toolbox
                  account when the purchase is completed.
                  ( To view a sample of the exported data,
                  <button type="button" class="text-primary underline hover:no-underline" (click)="openSampleModal()">
                    Please Click Here
                  </button>
                  )
                </p>
              }
            </p-accordion-content>
          </p-accordion-panel>
        </p-accordion>
      </div>

      <app-modal
        #sampleModal
        [title]="premierNote.sampleImageTitle"
        size="lg"
        [showFooter]="false"
      >
        <img
          [src]="premierNote.sampleImageSrc"
          [alt]="premierNote.sampleImageTitle"
          class="mx-auto max-h-[70vh] w-full object-contain"
        />
      </app-modal>

      @if (premierNote.priceRows?.length) {
        <app-modal #priceModal title="Full Price List" size="md" [showFooter]="false">
          <table class="w-full text-body-sm">
            <tbody>
              @for (row of premierNote.priceRows; track row.label) {
                <tr class="border-b border-border last:border-b-0">
                  <td class="py-2 pr-4 text-foreground">{{ row.label }}</td>
                  <td class="py-2 text-right font-medium text-foreground">{{ row.price }}</td>
                </tr>
              }
            </tbody>
          </table>
        </app-modal>
      }
    }
  `
})
export class AreaSearchPremierNoteComponent {
  protected readonly controlStyles = AreaSearchControlStyles;

  readonly groupId = input.required<number>();

  @ViewChild('sampleModal') private sampleModal?: ModalComponent;
  @ViewChild('priceModal') private priceModal?: ModalComponent;

  private readonly verticalService = inject(VerticalService);
  private readonly fieldsService = inject(AreaSearchFieldsService);
  protected readonly accordionState = inject(AreaSearchAccordionStateService);

  readonly note = computed(() => {
    const leadsChoices = this.fieldsService.getFieldsInfoSync()?.['leads_type']?.choices;
    const choiceMap =
      leadsChoices && typeof leadsChoices === 'object'
        ? (leadsChoices as Record<string, string>)
        : null;

    return buildAreaSearchPremierNote(
      this.groupId(),
      this.verticalService.content()?.app_config,
      choiceMap
    );
  });

  openSampleModal(): void {
    this.sampleModal?.open();
  }

  openPriceModal(): void {
    this.priceModal?.open();
  }
}
