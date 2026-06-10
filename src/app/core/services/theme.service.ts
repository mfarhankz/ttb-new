import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  BRAND_PRESETS,
  BRAND_STORAGE_KEY,
  FONT_FAMILY_STORAGE_KEY,
  THEME_STORAGE_KEY,
  VARIANT_PRESETS,
  VARIANT_STORAGE_KEY,
  VALID_FONT_FAMILIES,
  TenantThemeOverride,
  ThemeBrand,
  ThemeFontFamily,
  ThemeMode,
  ThemeVariant,
  ThemeTokens,
  fontFamilyToCssVars,
  getFontFamilyOption,
  tenantOverrideToCssVars,
  tokensToCssVars
} from '../theme/theme.config';

const VALID_VARIANTS = new Set<ThemeVariant>(['light', 'dark', 'main']);
const THEME_FONT_LINK_ID = 'ttb-theme-font';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private runtimeOverrides: Record<string, string> = {};
  private readonly _variant = signal<ThemeVariant>('main');
  private readonly _fontFamily = signal<ThemeFontFamily>('default');

  readonly variant = this._variant.asReadonly();
  readonly fontFamily = this._fontFamily.asReadonly();

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

    const storedFont = localStorage.getItem(FONT_FAMILY_STORAGE_KEY) as ThemeFontFamily | null;
    if (storedFont && VALID_FONT_FAMILIES.has(storedFont)) {
      this._fontFamily.set(storedFont);
    } else if (storedFont) {
      localStorage.removeItem(FONT_FAMILY_STORAGE_KEY);
    }

    this.applyVariant(variant, false);
    this.applyBrand(brand, false);
    this.reapplyUserFontPreference();
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

  setFontFamily(fontFamily: ThemeFontFamily): void {
    if (!VALID_FONT_FAMILIES.has(fontFamily)) {
      return;
    }

    this._fontFamily.set(fontFamily);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(FONT_FAMILY_STORAGE_KEY, fontFamily);
    }
    this.reapplyUserFontPreference();
  }

  applyTenantTheme(override: TenantThemeOverride): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const vars = tenantOverrideToCssVars(override);
    this.runtimeOverrides = { ...this.runtimeOverrides, ...vars };
    this.applyCssVars(vars);
    this.reapplyUserFontPreference();
  }

  /** Apply arbitrary design-token CSS variables (used by VerticalService presets). */
  applyCssVars(vars: Record<string, string>): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const root = document.documentElement;
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }
  }

  /** Re-apply a user-selected font after theme or vertical token updates. */
  reapplyUserFontPreference(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const fontFamily = this._fontFamily();
    if (fontFamily === 'default') {
      this.removeWebFont();
      return;
    }

    const vars = fontFamilyToCssVars(fontFamily);
    if (vars) {
      this.applyCssVars(vars);
    }

    const option = getFontFamilyOption(fontFamily);
    if (option.googleFontsUrl) {
      this.loadWebFont(option.googleFontsUrl);
    } else {
      this.removeWebFont();
    }
  }

  resetToDefault(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.runtimeOverrides = {};
    this._fontFamily.set('default');
    localStorage.removeItem(FONT_FAMILY_STORAGE_KEY);
    const variant = this.getVariant();
    const brand = this.getBrand();
    this.applyTokens(VARIANT_PRESETS[variant].tokens);
    if (brand !== 'default') {
      this.applyCssVars(tokensToCssVars(BRAND_PRESETS[brand]));
    }
    this.removeWebFont();
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
    this.reapplyUserFontPreference();

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
    this.reapplyUserFontPreference();
    if (persist) {
      localStorage.setItem(BRAND_STORAGE_KEY, brand);
    }
  }

  private applyTokens(tokens: ThemeTokens): void {
    this.applyCssVars(tokensToCssVars(tokens));
  }

  private loadWebFont(url: string): void {
    let link = document.getElementById(THEME_FONT_LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = THEME_FONT_LINK_ID;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.href !== url) {
      link.href = url;
    }
  }

  private removeWebFont(): void {
    document.getElementById(THEME_FONT_LINK_ID)?.remove();
  }
}
