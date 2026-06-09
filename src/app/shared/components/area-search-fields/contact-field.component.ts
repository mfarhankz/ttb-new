import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Accordion, AccordionContent, AccordionHeader, AccordionPanel } from 'primeng/accordion';
import { RadioButton } from 'primeng/radiobutton';
import { AreaSearchFieldMeta, AreaSearchFormFieldValue } from '@app/core/interfaces/area-search-field.interface';
import { AREA_SEARCH_CONTACT_CHOICE_ORDER } from '@app/core/config/area-search-fields.config';
import { VerticalService } from '@app/core/services/vertical.service';
import { readAreaSearchContactPricing } from '@app/core/utils/area-search-contact-note.util';
import { mapFieldChoices } from './area-search-field.utils';
import { AreaSearchControlStyles } from './area-search-control.styles';

interface ContactChoiceCard {
  value: string;
  label: string;
  icon: string;
  iconClass: string;
  priceLabel: string;
}

@Component({
  selector: 'app-area-search-contact-field',
  standalone: true,
  imports: [FormsModule, Accordion, AccordionPanel, AccordionHeader, AccordionContent, RadioButton],
  host: {
    class: 'block w-full'
  },
  template: `
    <div class="flex w-full flex-col gap-5">
      <div>
        <h2 class="text-body font-semibold text-[#8a6d3b]">Phones / Emails</h2>
        <p class="mt-1 text-body-sm text-subtle">
          Third party vendor providing phones and/or email addresses on your selected property group.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <span
          class="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-caption text-foreground"
        >
          <i class="pi pi-phone text-primary"></i>
          {{ pricing().phoneCents }}¢ / phone
        </span>
        <span
          class="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-caption text-foreground"
        >
          <i class="pi pi-envelope text-success"></i>
          {{ pricing().emailCents }}¢ / email
        </span>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        @for (card of cards(); track card.value) {
          <label
            class="cursor-pointer rounded-md border bg-surface p-4 transition-colors"
            [class.border-primary]="value?.value === card.value"
            [class.ring-1]="value?.value === card.value"
            [class.ring-primary/30]="value?.value === card.value"
            [class.border-border]="value?.value !== card.value"
            [class.hover:border-primary/40]="value?.value !== card.value"
          >
            <div class="mb-3 flex items-start justify-between gap-2">
              <i [class]="card.icon + ' ' + card.iconClass + ' text-xl'"></i>
              <p-radiobutton
                [name]="field.field_name"
                [value]="card.value"
                [ngModel]="value?.value"
                (ngModelChange)="select($event)"
              />
            </div>
            <div class="text-body-sm font-medium text-foreground">{{ card.label }}</div>
            <div class="mt-1 text-caption text-subtle">{{ card.priceLabel }}</div>
          </label>
        }
      </div>

      <p-accordion
        [class]="controlStyles.premierNoteAccordion"
        [multiple]="true"
        [value]="['pricing-details']"
      >
        <p-accordion-panel value="pricing-details">
          <p-accordion-header>Pricing &amp; Billing Details</p-accordion-header>
          <p-accordion-content>
            <div class="space-y-3 text-body-sm leading-relaxed text-[#8a6d3b]">
              <p>
                They tend to match phones to property addresses on
                <strong class="font-semibold">{{ pricing().phoneMatchPercent }}%</strong> of a list and charge
                <strong class="font-semibold">{{ pricing().phoneCents }} cents</strong> per phone number found. They
                tend to find email addresses on
                <strong class="font-semibold">{{ pricing().emailMatchPercent }}%</strong> of a property list and charge
                <strong class="font-semibold">{{ pricing().emailCents }} cents</strong> per email.
              </p>
              <p>
                These are estimates — the final email/phone count will not be known until after the purchase is made.
                Credit cards will be authorized for phones and/or emails on
                <strong class="font-semibold">100%</strong> of records submitted. Once the phone/email look-up is
                complete, credit cards will be charged for the exact amount of the phones and/or email addresses that
                were found on the properties that were submitted.
              </p>
              <p>
                As this data comes from a third party vendor, we cannot guarantee the accuracy of all phone
                numbers/email addresses provided. All purchases of phone/email data are final.
              </p>
            </div>
          </p-accordion-content>
        </p-accordion-panel>
      </p-accordion>

      <p-accordion
        [class]="controlStyles.dangerNoteAccordion"
        [multiple]="true"
        [value]="['dnc-notice']"
      >
        <p-accordion-panel value="dnc-notice">
          <p-accordion-header>
            <span class="inline-flex items-center gap-2">
              <i class="pi pi-exclamation-triangle"></i>
              Important: Do Not Call Registry Notice
            </span>
          </p-accordion-header>
          <p-accordion-content>
            <p class="text-body-sm leading-relaxed text-[#a94442]">
              This vendor's phone numbers are NOT scrubbed against the "Do Not Call" registry.
              @if (pricing().useExtendedDncNote) {
                It is your responsibility to confirm that the phone numbers provided are not on any Federal, State, or
                internal company Do Not Call registries.
              } @else {
                The use of the phone numbers that you purchase is your responsibility.
              }
            </p>
          </p-accordion-content>
        </p-accordion-panel>
      </p-accordion>
    </div>
  `
})
export class AreaSearchContactFieldComponent {
  protected readonly controlStyles = AreaSearchControlStyles;

  @Input({ required: true }) field!: AreaSearchFieldMeta;
  @Input() value?: AreaSearchFormFieldValue;
  @Output() valueChange = new EventEmitter<Partial<AreaSearchFormFieldValue>>();

  private readonly verticalService = inject(VerticalService);

  readonly pricing = computed(() =>
    readAreaSearchContactPricing(this.verticalService.content()?.app_config)
  );

  readonly cards = computed((): ContactChoiceCard[] => {
    const choices = mapFieldChoices(this.field);
    const byValue = new Map(choices.map((choice) => [choice.value, choice.label]));
    const { phoneCents, emailCents } = this.pricing();

    const meta: Record<string, Pick<ContactChoiceCard, 'icon' | 'iconClass' | 'priceLabel'>> = {
      PH: { icon: 'pi pi-phone', iconClass: 'text-primary', priceLabel: `${phoneCents}¢ / phone` },
      EM: { icon: 'pi pi-envelope', iconClass: 'text-success', priceLabel: `${emailCents}¢ / email` },
      $: {
        icon: 'pi pi-users',
        iconClass: 'text-[#8a6d3b]',
        priceLabel: `${phoneCents}¢ + ${emailCents}¢`
      }
    };

    return AREA_SEARCH_CONTACT_CHOICE_ORDER.map((value) => ({
      value,
      label: byValue.get(value) ?? value,
      icon: meta[value].icon,
      iconClass: meta[value].iconClass,
      priceLabel: meta[value].priceLabel
    })).filter((card) => byValue.has(card.value));
  });

  select(value: string): void {
    this.valueChange.emit({ search_type: 'RDB', value });
  }
}
