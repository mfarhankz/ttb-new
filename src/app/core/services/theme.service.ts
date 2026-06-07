import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  BRAND_PRESETS,
  BRAND_STORAGE_KEY,
  THEME_PRESETS,
  THEME_STORAGE_KEY,
  TenantThemeOverride,
  ThemeBrand,
  ThemeMode,
  ThemeTokens,
  tenantOverrideToCssVars,
  tokensToCssVars
} from '../theme/theme.config';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private runtimeOverrides: Record<string, string> = {};

  init(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const storedMode = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    const mode: ThemeMode = storedMode === 'dark' ? 'dark' : 'light';

    const storedBrand = localStorage.getItem(BRAND_STORAGE_KEY) as ThemeBrand | null;
    const brand: ThemeBrand =
      storedBrand && (storedBrand === 'default' || storedBrand === 'acme') ? storedBrand : 'default';

    this.applyMode(mode, false);
    this.applyBrand(brand, false);
  }

  getMode(): ThemeMode {
    if (!isPlatformBrowser(this.platformId)) return 'light';
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  getBrand(): ThemeBrand {
    if (!isPlatformBrowser(this.platformId)) return 'default';
    const brand = document.documentElement.getAttribute('data-brand');
    return brand === 'acme' ? 'acme' : 'default';
  }

  setMode(mode: ThemeMode): void {
    this.applyMode(mode, true);
  }

  toggleMode(): void {
    this.setMode(this.getMode() === 'light' ? 'dark' : 'light');
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
    const mode = this.getMode();
    const brand = this.getBrand();
    this.applyTokens(THEME_PRESETS[mode]);
    if (brand !== 'default') {
      this.applyCssVars(tokensToCssVars(BRAND_PRESETS[brand]));
    }
  }

  private applyMode(mode: ThemeMode, persist: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.documentElement.setAttribute('data-theme', mode);
    this.applyTokens(THEME_PRESETS[mode]);
    const brand = this.getBrand();
    if (brand !== 'default') {
      this.applyCssVars(tokensToCssVars(BRAND_PRESETS[brand]));
    }
    this.applyCssVars(this.runtimeOverrides);
    if (persist) {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
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
