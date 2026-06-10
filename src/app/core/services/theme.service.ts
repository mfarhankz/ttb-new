import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  BRAND_PRESETS,
  BRAND_STORAGE_KEY,
  THEME_STORAGE_KEY,
  VARIANT_PRESETS,
  VARIANT_STORAGE_KEY,
  TenantThemeOverride,
  ThemeBrand,
  ThemeMode,
  ThemeVariant,
  ThemeTokens,
  tenantOverrideToCssVars,
  tokensToCssVars
} from '../theme/theme.config';

const VALID_VARIANTS = new Set<ThemeVariant>(['light', 'dark', 'main']);

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private runtimeOverrides: Record<string, string> = {};
  private readonly _variant = signal<ThemeVariant>('main');

  readonly variant = this._variant.asReadonly();

  init(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const storedVariant = localStorage.getItem(VARIANT_STORAGE_KEY) as ThemeVariant | null;
    let variant: ThemeVariant = 'main';

    if (storedVariant && VALID_VARIANTS.has(storedVariant)) {
      variant = storedVariant;
    } else {
      const storedMode = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      variant = storedMode === 'dark' ? 'dark' : 'main';
    }

    const storedBrand = localStorage.getItem(BRAND_STORAGE_KEY) as ThemeBrand | null;
    const brand: ThemeBrand =
      storedBrand && (storedBrand === 'default' || storedBrand === 'acme') ? storedBrand : 'default';

    this.applyVariant(variant, false);
    this.applyBrand(brand, false);
  }

  getMode(): ThemeMode {
    if (!isPlatformBrowser(this.platformId)) return 'light';
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  getVariant(): ThemeVariant {
    return this._variant();
  }

  getBrand(): ThemeBrand {
    if (!isPlatformBrowser(this.platformId)) return 'default';
    const brand = document.documentElement.getAttribute('data-brand');
    return brand === 'acme' ? 'acme' : 'default';
  }

  setMode(mode: ThemeMode): void {
    const variant: ThemeVariant = mode === 'dark' ? 'dark' : 'main';
    this.setVariant(variant);
  }

  setVariant(variant: ThemeVariant): void {
    this.applyVariant(variant, true);
  }

  toggleMode(): void {
    this.setVariant(this.getVariant() === 'dark' ? 'main' : 'dark');
  }

  setBrand(brand: ThemeBrand): void {
    this.applyBrand(brand, true);
  }

  applyTenantTheme(override: TenantThemeOverride): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const vars = tenantOverrideToCssVars(override);
    this.runtimeOverrides = { ...this.runtimeOverrides, ...vars };
    this.applyCssVars(vars);
  }

  /** Apply arbitrary design-token CSS variables (used by VerticalService presets). */
  applyCssVars(vars: Record<string, string>): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const root = document.documentElement;
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }
  }

  resetToDefault(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.runtimeOverrides = {};
    const variant = this.getVariant();
    const brand = this.getBrand();
    this.applyTokens(VARIANT_PRESETS[variant].tokens);
    if (brand !== 'default') {
      this.applyCssVars(tokensToCssVars(BRAND_PRESETS[brand]));
    }
  }

  private applyVariant(variant: ThemeVariant, persist: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const preset = VARIANT_PRESETS[variant];
    this._variant.set(variant);
    document.documentElement.setAttribute('data-theme', preset.mode);
    this.applyTokens(preset.tokens);

    const brand = this.getBrand();
    if (brand !== 'default') {
      this.applyCssVars(tokensToCssVars(BRAND_PRESETS[brand]));
    }
    this.applyCssVars(this.runtimeOverrides);

    if (persist) {
      localStorage.setItem(VARIANT_STORAGE_KEY, variant);
      localStorage.setItem(THEME_STORAGE_KEY, preset.mode);
    }
  }

  private applyBrand(brand: ThemeBrand, persist: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (brand === 'default') {
      document.documentElement.removeAttribute('data-brand');
    } else {
      document.documentElement.setAttribute('data-brand', brand);
      this.applyCssVars(tokensToCssVars(BRAND_PRESETS[brand]));
    }
    this.applyCssVars(this.runtimeOverrides);
    if (persist) {
      localStorage.setItem(BRAND_STORAGE_KEY, brand);
    }
  }

  private applyTokens(tokens: ThemeTokens): void {
    this.applyCssVars(tokensToCssVars(tokens));
  }
}
