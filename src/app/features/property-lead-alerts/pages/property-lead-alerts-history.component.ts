import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { finalize } from 'rxjs';
import { PlaHistoryRecord } from '@app/features/property-lead-alerts/interfaces/property-lead-alerts.interface';
import { PropertyLeadAlertsService } from '@app/features/property-lead-alerts/services/property-lead-alerts.service';
import { AlertComponent, ButtonComponent, CardComponent } from '@app/shared/components';

@Component({
  selector: 'app-property-lead-alerts-history',
  standalone: true,
  imports: [CardComponent, AlertComponent, ButtonComponent],
  templateUrl: './property-lead-alerts-history.component.html'
})
export class PropertyLeadAlertsHistoryComponent implements OnInit {
  private readonly plaService = inject(PropertyLeadAlertsService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly records = signal<PlaHistoryRecord[]>([]);
  readonly currentIndex = signal(0);

  readonly currentRecord = computed(() => this.records()[this.currentIndex()] ?? null);
  readonly currentHtml = computed(() => {
    const html = this.currentRecord()?.properties;
    if (!html) {
      return null;
    }

    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  readonly pageLabel = computed(() => {
    const total = this.records().length;
    if (!total) {
      return '';
    }

    return `${this.currentIndex() + 1} / ${total}`;
  });

  ngOnInit(): void {
    this.loadHistory();
  }

  goToPrevious(): void {
    if (this.currentIndex() > 0) {
      this.currentIndex.update((index) => index - 1);
    }
  }

  goToNext(): void {
    if (this.currentIndex() < this.records().length - 1) {
      this.currentIndex.update((index) => index + 1);
    }
  }

  private loadHistory(): void {
    this.loading.set(true);
    this.error.set(null);

    this.plaService
      .fetchHistory()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (records) => {
          this.records.set(records);
          this.currentIndex.set(0);
        },
        error: (err: Error) => this.error.set(err.message)
      });
  }
}
