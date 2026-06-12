import {
  AfterViewInit,
  Component,
  ElementRef,
  effect,
  input,
  OnDestroy,
  output,
  PLATFORM_ID,
  QueryList,
  signal,
  untracked,
  ViewChild,
  ViewChildren,
  inject
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TabNavItem } from './tab-nav.types';

@Component({
  selector: 'app-tab-nav',
  standalone: true,
  templateUrl: './tab-nav.component.html',
  styles: [
    `
      .dashboard-tabs-slider {
        transition:
          transform 0.32s cubic-bezier(0.34, 1.15, 0.64, 1),
          width 0.32s cubic-bezier(0.34, 1.15, 0.64, 1),
          opacity 0.2s ease;
        will-change: transform, width;
      }

      @media (prefers-reduced-motion: reduce) {
        .dashboard-tabs-slider {
          transition: none !important;
        }
      }
    `
  ]
})
export class TabNavComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  readonly items = input.required<TabNavItem[]>();
  readonly activeId = input.required<string>();
  readonly ariaLabel = input('Tabs');

  readonly activeIdChange = output<string>();

  @ViewChild('tabNav') tabNav?: ElementRef<HTMLElement>;
  @ViewChildren('tabButton') tabButtons?: QueryList<ElementRef<HTMLButtonElement>>;

  readonly tabIndicator = signal({ width: 0, left: 0, ready: false });

  private resizeObserver?: ResizeObserver;
  private tabButtonsChangesSub?: { unsubscribe(): void };
  private readonly onWindowResize = (): void => this.updateTabIndicator();

  constructor() {
    effect(() => {
      this.activeId();
      this.items();
      untracked(() => this.scheduleTabIndicatorUpdate());
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.scheduleTabIndicatorUpdate();
    window.addEventListener('resize', this.onWindowResize);
    this.tabButtonsChangesSub = this.tabButtons?.changes.subscribe(() => this.updateTabIndicator());

    const navElement = this.tabNav?.nativeElement;
    if (navElement && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.updateTabIndicator());
      this.resizeObserver.observe(navElement);
    }
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    window.removeEventListener('resize', this.onWindowResize);
    this.resizeObserver?.disconnect();
    this.tabButtonsChangesSub?.unsubscribe();
  }

  isActive(item: TabNavItem): boolean {
    return this.activeId() === item.id;
  }

  selectTab(item: TabNavItem): void {
    if (this.activeId() !== item.id) {
      this.activeIdChange.emit(item.id);
    }

    this.scheduleTabIndicatorUpdate();
  }

  tabSliderStyle(): { transform: string; width: string; opacity: number } {
    const slider = this.tabIndicator();
    return {
      transform: `translateX(${slider.left}px)`,
      width: `${slider.width}px`,
      opacity: slider.ready ? 1 : 0
    };
  }

  scheduleTabIndicatorUpdate(): void {
    requestAnimationFrame(() => this.updateTabIndicator());
    setTimeout(() => this.updateTabIndicator(), 0);
  }

  private updateTabIndicator(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const navElement = this.tabNav?.nativeElement;
    const buttons = this.tabButtons?.toArray() ?? [];
    const tabs = this.items();
    const activeIndex = tabs.findIndex((tab) => this.isActive(tab));
    const activeButton = buttons[activeIndex]?.nativeElement;

    if (!navElement || !activeButton) {
      return;
    }

    this.tabIndicator.set({
      left: activeButton.offsetLeft,
      width: activeButton.offsetWidth,
      ready: true
    });
  }
}
