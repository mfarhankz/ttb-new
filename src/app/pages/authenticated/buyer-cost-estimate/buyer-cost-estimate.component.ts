import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { AuthService } from '@app/core/services/auth.service';
import { NetSheetConfig } from '@app/core/interfaces/net-sheet.interface';
import { CardComponent } from '@app/shared/components';
import { AreaSearchControlStyles } from '@app/shared/components/area-search-fields/area-search-control.styles';
import { NetSheetComponent } from '@app/shared/components/net-sheet/net-sheet.component';

@Component({
  selector: 'app-buyer-cost-estimate',
  standalone: true,
  imports: [FormsModule, InputText, CardComponent, NetSheetComponent],
  template: `
    <div class="flex min-h-screen flex-col bg-background p-4 md:p-6 lg:p-8">
      <app-card
        title="Buyer Cost Estimate"
        subtitle="Enter property details to calculate buyer closing costs."
        [headerActions]="true"
        [padding]="'lg'"
        class="w-[75%] max-w-360"
      >
        <div headerActions class="flex w-full min-w-100 max-w-xs flex-col gap-0.5">
          <label [class]="controlStyles.fieldLabel" for="bce-net-sheet-name">Net Sheet Name</label>
          <input
            pInputText
            id="bce-net-sheet-name"
            type="text"
            placeholder="Net Sheet Name here..."
            [class]="controlStyles.input"
            [(ngModel)]="netSheetName"
          />
        </div>

        <app-net-sheet [config]="blankConfig()" [(siteAddress)]="netSheetName" />
      </app-card>
    </div>
  `
})
export class BuyerCostEstimateComponent {
  protected readonly controlStyles = AreaSearchControlStyles;

  private readonly authService = inject(AuthService);

  netSheetName = '';

  readonly blankConfig = computed(
    (): NetSheetConfig => ({
      isBlankMode: true,
      blankNameInHeader: true,
      preparedByName: this.authService.getUserName() ?? undefined,
      notClosable: true
    })
  );
}
