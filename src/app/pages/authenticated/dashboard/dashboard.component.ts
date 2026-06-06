import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  PLATFORM_ID,
  signal,
  ViewChild
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { WalletBalanceCardComponent, SubscriptionCardComponent } from './components';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [WalletBalanceCardComponent, SubscriptionCardComponent],
  templateUrl: './dashboard.component.html',
  styles: []
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('walletColumn') walletColumn?: ElementRef<HTMLElement>;

  readonly matchedCardHeight = signal<number | null>(null);
  readonly subscriptionExpanded = signal(false);
  readonly name = computed(() => this.authService.getUserName());
  readonly subscriptionColumnHeight = computed(() =>
    this.subscriptionExpanded() ? null : this.matchedCardHeight()
  );

  private resizeObserver?: ResizeObserver;
  private readonly onWindowResize = (): void => this.syncSubscriptionHeight();

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.syncSubscriptionHeight();
    window.addEventListener('resize', this.onWindowResize);

    const walletElement = this.walletColumn?.nativeElement;
    if (!walletElement || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => this.syncSubscriptionHeight());
    this.resizeObserver.observe(walletElement);
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    window.removeEventListener('resize', this.onWindowResize);
    this.resizeObserver?.disconnect();
  }

  private syncSubscriptionHeight(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const walletElement = this.walletColumn?.nativeElement;
    if (!walletElement || window.innerWidth < 1280) {
      this.matchedCardHeight.set(null);
      return;
    }

    this.matchedCardHeight.set(walletElement.offsetHeight);
  }
}
