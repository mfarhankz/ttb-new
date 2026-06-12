import { DOCUMENT } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  Renderer2,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { AutocompleteItem } from './autocomplete.types';

@Component({
  selector: 'app-autocomplete',
  standalone: true,
  imports: [FormsModule, InputText],
  templateUrl: './autocomplete.component.html',
  host: {
    class: 'block'
  }
})
export class AutocompleteComponent<T = unknown> {
  private readonly document = inject(DOCUMENT);
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hostRef = inject(ElementRef<HTMLElement>);

  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');
  private readonly panelEl = viewChild<ElementRef<HTMLElement>>('panelEl');

  readonly inputId = input('');
  readonly placeholder = input('Search...');
  readonly size = input<'small' | 'large'>('small');
  readonly disabled = input(false);
  readonly items = input<AutocompleteItem<T>[]>([]);
  readonly loading = input(false);
  readonly error = input(false);
  readonly noMatch = input(false);
  readonly appendTo = input<'self' | 'body'>('body');
  readonly itemIcon = input<string | null>(null);

  readonly queryChange = output<string>();
  readonly itemSelect = output<AutocompleteItem<T>>();

  readonly query = signal('');
  readonly selectedIndex = signal(-1);
  readonly panelOpen = signal(false);
  readonly panelStyle = signal<{ top: number; left: number; width: number } | null>(null);

  private panelAttachedToBody = false;

  constructor() {
    effect(() => {
      this.items();
      this.selectedIndex.set(-1);
    });

    effect(() => {
      this.items();
      this.loading();
      this.error();
      this.noMatch();
      if (this.panelOpen()) {
        this.updatePanelPosition();
      }
    });

    effect(() => {
      if (!this.panelOpen() || !this.showPanel()) {
        this.panelAttachedToBody = false;
      }
    });

    effect(() => {
      if (!this.panelOpen() || !this.showPanel()) {
        return;
      }

      queueMicrotask(() => this.attachPanelToBody());
    });

    fromEvent(this.document.defaultView ?? window, 'scroll', { capture: true })
      .pipe(debounceTime(10), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.panelOpen()) {
          this.updatePanelPosition();
        }
      });

    fromEvent(this.document.defaultView ?? window, 'resize')
      .pipe(debounceTime(50), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.panelOpen()) {
          this.updatePanelPosition();
        }
      });

    this.destroyRef.onDestroy(() => this.detachPanelFromBody());
  }

  showPanel(): boolean {
    return (this.items().length > 0 && !this.loading()) || this.error() || this.noMatch();
  }

  onInputChange(value: string): void {
    this.query.set(value);
    this.queryChange.emit(value);
    this.panelOpen.set(true);
    this.updatePanelPosition();
  }

  onFocus(): void {
    this.panelOpen.set(true);
    this.updatePanelPosition();
  }

  onBlur(): void {
    setTimeout(() => {
      this.panelOpen.set(false);
      this.panelStyle.set(null);
      this.detachPanelFromBody();
    }, 200);
  }

  onKeydown(event: KeyboardEvent): void {
    const items = this.items();

    switch (event.key) {
      case 'ArrowDown':
        if (this.selectedIndex() < items.length - 1) {
          this.selectedIndex.update((index) => index + 1);
        }
        event.preventDefault();
        break;
      case 'ArrowUp':
        if (this.selectedIndex() > 0) {
          this.selectedIndex.update((index) => index - 1);
        }
        event.preventDefault();
        break;
      case 'Enter': {
        const selected = items[this.selectedIndex()];
        if (selected) {
          this.onItemSelect(selected);
        }
        event.preventDefault();
        break;
      }
      case 'Escape':
        this.panelOpen.set(false);
        this.panelStyle.set(null);
        this.detachPanelFromBody();
        break;
      default:
        this.panelOpen.set(true);
        this.updatePanelPosition();
    }
  }

  onItemSelect(item: AutocompleteItem<T>): void {
    this.query.set(item.label);
    this.selectedIndex.set(-1);
    this.panelOpen.set(false);
    this.panelStyle.set(null);
    this.detachPanelFromBody();
    this.itemSelect.emit(item);
  }

  reset(value = ''): void {
    this.query.set(value);
    this.selectedIndex.set(-1);
    this.panelOpen.set(false);
    this.panelStyle.set(null);
    this.detachPanelFromBody();
  }

  private attachPanelToBody(): void {
    if (this.appendTo() !== 'body' || this.panelAttachedToBody) {
      return;
    }

    const panel = this.panelEl()?.nativeElement;
    if (!panel || panel.parentElement === this.document.body) {
      return;
    }

    this.renderer.appendChild(this.document.body, panel);
    this.panelAttachedToBody = true;
    this.updatePanelPosition();
  }

  private detachPanelFromBody(): void {
    if (!this.panelAttachedToBody) {
      return;
    }

    const panel = this.panelEl()?.nativeElement;
    if (panel?.parentElement === this.document.body) {
      this.renderer.removeChild(this.document.body, panel);
    }

    this.panelAttachedToBody = false;
  }

  private updatePanelPosition(): void {
    const input = this.inputEl()?.nativeElement;
    if (!input) {
      return;
    }

    const inputRect = input.getBoundingClientRect();

    if (this.appendTo() === 'body') {
      this.panelStyle.set({
        top: inputRect.bottom + 4,
        left: inputRect.left,
        width: inputRect.width
      });
      return;
    }

    const hostRect = this.hostRef.nativeElement.getBoundingClientRect();
    this.panelStyle.set({
      top: inputRect.bottom - hostRect.top + 4,
      left: inputRect.left - hostRect.left,
      width: inputRect.width
    });
  }
}
