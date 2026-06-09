import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '@app/shared/components';
import { AreaSearchFormFieldValue } from '@app/core/interfaces/area-search-field.interface';
import { AreaSearchFormService } from '@app/core/services/area-search-form.service';

@Component({
  selector: 'app-area-search-geometry-field',
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <div class="rounded-md border border-border bg-surface p-4 flex flex-col gap-3">
      <div class="text-sm font-medium text-foreground">Map Shape</div>
      @if (hasGeometry) {
        <p class="text-sm text-subtle">A search shape is applied ({{ value?.match }}).</p>
        <div class="flex gap-2">
          <app-button variant="outline" size="sm" (onClick)="clearGeometry()">Remove Shape</app-button>
        </div>
      } @else {
        <p class="text-sm text-subtle">Draw a radius or boundary on the farming map to search by area.</p>
        <div class="flex flex-wrap gap-2">
          <app-button variant="outline" size="sm" (onClick)="goToRadius()">Radius Search</app-button>
          <app-button variant="outline" size="sm" (onClick)="goToBoundary()">Boundary Search</app-button>
        </div>
      }
    </div>
  `
})
export class AreaSearchGeometryFieldComponent {
  private readonly router = inject(Router);
  private readonly formService = inject(AreaSearchFormService);

  @Input() value?: AreaSearchFormFieldValue;
  @Output() valueChange = new EventEmitter<Partial<AreaSearchFormFieldValue>>();

  get hasGeometry(): boolean {
    return this.formService.hasGeometry();
  }

  clearGeometry(): void {
    this.formService.clearGeometry();
    this.valueChange.emit({ search_type: 'geometry', match: undefined, value: undefined });
  }

  goToRadius(): void {
    void this.router.navigate(['/farming/radius-search']);
  }

  goToBoundary(): void {
    void this.router.navigate(['/farming/boundary-search']);
  }
}
