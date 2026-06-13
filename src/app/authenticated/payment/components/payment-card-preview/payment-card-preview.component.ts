import { NgClass } from '@angular/common';
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-payment-card-preview',
  standalone: true,
  imports: [NgClass],
  templateUrl: './payment-card-preview.component.html',
  styles: [
    `
      :host {
        display: block;
      }

      .payment-card-scene {
        perspective: 1200px;
        width: 100%;
        max-width: 360px;
        margin-inline: auto;
      }

      .payment-card {
        position: relative;
        width: 100%;
        aspect-ratio: 1.586;
        transform-style: preserve-3d;
        transition: transform 0.65s cubic-bezier(0.4, 0.2, 0.2, 1);
        animation: payment-card-float 5s ease-in-out infinite;
      }

      .payment-card.is-flipped {
        transform: rotateY(180deg);
        animation: none;
      }

      .payment-card-face {
        position: absolute;
        inset: 0;
        border-radius: 16px;
        backface-visibility: hidden;
        overflow: hidden;
        box-shadow:
          0 18px 40px rgb(15 23 42 / 0.22),
          0 0 0 1px rgb(255 255 255 / 0.08) inset;
      }

      .payment-card-front {
        padding: 1.35rem 1.5rem;
        color: #fff;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .payment-card-back {
        transform: rotateY(180deg);
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      }

      .payment-card-back-strip {
        height: 3rem;
        margin-top: 1.5rem;
        background: #020617;
      }

      .payment-card-back-cvc {
        margin: 1.25rem 1.5rem 0 auto;
        width: 75%;
        background: #f8fafc;
        color: #0f172a;
        border-radius: 6px;
        padding: 0.55rem 0.85rem;
        font-family: ui-monospace, monospace;
        font-size: 1rem;
        letter-spacing: 0.2em;
        text-align: right;
      }

      .payment-card-back-label {
        margin: 0.35rem 1.5rem 0 auto;
        width: 75%;
        text-align: right;
        font-size: 0.65rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgb(255 255 255 / 0.55);
      }

      .payment-card-chip {
        width: 2.75rem;
        height: 2rem;
        border-radius: 6px;
        background: linear-gradient(135deg, #fde68a 0%, #d97706 55%, #fbbf24 100%);
        box-shadow: 0 0 0 1px rgb(0 0 0 / 0.15) inset;
      }

      .payment-card-brand {
        font-size: 0.95rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        opacity: 0.95;
      }

      .payment-card-number {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: clamp(1.05rem, 2.4vw, 1.35rem);
        letter-spacing: 0.14em;
        white-space: nowrap;
        transition: opacity 0.2s ease;
      }

      .payment-card-meta {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-end;
      }

      .payment-card-label {
        display: block;
        font-size: 0.6rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        opacity: 0.65;
        margin-bottom: 0.2rem;
      }

      .payment-card-value {
        font-size: 0.85rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 11rem;
      }

      .payment-card-shine {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          115deg,
          transparent 0%,
          rgb(255 255 255 / 0.12) 45%,
          transparent 60%
        );
        transform: translateX(-120%);
        animation: payment-card-shine 4.5s ease-in-out infinite;
        pointer-events: none;
      }

      .theme-visa {
        background: linear-gradient(135deg, #1a3c8c 0%, #2557c8 45%, #14326e 100%);
      }

      .theme-mastercard {
        background: linear-gradient(135deg, #1f2937 0%, #7c2d12 48%, #111827 100%);
      }

      .theme-amex {
        background: linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #082f49 100%);
      }

      .theme-discover {
        background: linear-gradient(135deg, #3f3f46 0%, #ea580c 42%, #1c1917 100%);
      }

      .theme-default {
        background: linear-gradient(135deg, #64748b 0%, #94a3b8 45%, #475569 100%);
      }

      @keyframes payment-card-float {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-6px);
        }
      }

      @keyframes payment-card-shine {
        0%,
        70%,
        100% {
          transform: translateX(-120%);
        }
        85% {
          transform: translateX(120%);
        }
      }
    `
  ]
})
export class PaymentCardPreviewComponent {
  readonly cardNumber = input('');
  readonly cardholderName = input('');
  readonly expiry = input('');
  readonly cvc = input('');
  readonly cardType = input('');
  readonly flipped = input(false);

  readonly displayNumber = computed(() => this.formatCardNumber(this.cardNumber()));
  readonly displayName = computed(() => this.cardholderName().trim() || 'YOUR FULL NAME');
  readonly displayExpiry = computed(() => this.formatExpiry(this.expiry()));
  readonly displayCvc = computed(() => (this.cvc().trim() || '•••').slice(0, 4));
  readonly themeClass = computed(() => {
    switch (this.cardType()) {
      case 'Visa':
        return 'theme-visa';
      case 'MasterCard':
        return 'theme-mastercard';
      case 'Amex':
        return 'theme-amex';
      case 'Discover':
        return 'theme-discover';
      default:
        return 'theme-default';
    }
  });

  private formatCardNumber(value: string): string {
    const digits = String(value ?? '').replace(/\D/g, '').slice(0, 16);
    if (!digits) {
      return '•••• •••• •••• ••••';
    }

    const isAmex = /^3[47]/.test(digits);
    if (isAmex) {
      return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)]
        .filter(Boolean)
        .join(' ')
        .padEnd(17, '•');
    }

    return digits
      .replace(/(\d{4})(?=\d)/g, '$1 ')
      .concat(' •••• •••• •••• ••••')
      .slice(0, 19);
  }

  private formatExpiry(value: string): string {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) {
      return 'MM/YY';
    }

    const parts = trimmed.split('/').map((part) => part.trim());
    if (parts.length >= 2) {
      const month = parts[0].slice(0, 2).padStart(2, '0');
      const year = parts[1].slice(-2);
      return `${month}/${year}`;
    }

    return trimmed.slice(0, 5);
  }
}
