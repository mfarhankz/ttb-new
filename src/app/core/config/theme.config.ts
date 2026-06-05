/**
 * Design token presets for white-label theming.
 *
 * Conventions:
 * - Use semantic Tailwind classes in app code (text-foreground, bg-primary, text-h1).
 * - Do NOT use raw palette classes (gray-*, blue-*, etc.) in components.
 * - Colors are space-separated RGB triplets for use with rgb(var(--token) / <alpha>).
 */

export type ThemeMode = 'light' | 'dark';
export type ThemeBrand = 'default' | 'acme';

export interface ThemeTokens {
  // Brand
  '--color-primary': string;
  '--color-primary-foreground': string;
  '--color-secondary': string;
  '--color-secondary-foreground': string;
  '--color-accent': string;
  '--color-accent-foreground': string;
  // Surfaces
  '--color-background': string;
  '--color-surface': string;
  '--color-surface-elevated': string;
  '--color-overlay': string;
  // Text
  '--color-foreground': string;
  '--color-muted': string;
  '--color-subtle': string;
  '--color-inverse': string;
  // Borders
  '--color-border': string;
  '--color-border-strong': string;
  // States
  '--color-success': string;
  '--color-success-foreground': string;
  '--color-warning': string;
  '--color-warning-foreground': string;
  '--color-danger': string;
  '--color-danger-foreground': string;
  '--color-info': string;
  '--color-info-foreground': string;
  // Focus
  '--color-focus-ring': string;
  // Sidebar
  '--sidebar-width': string;
  '--sidebar-width-collapsed': string;
  '--color-sidebar': string;
  '--color-sidebar-foreground': string;
  '--color-sidebar-muted': string;
  '--color-sidebar-active': string;
  '--color-sidebar-hover': string;
  '--color-sidebar-border': string;
  '--color-sidebar-tooltip': string;
  '--color-sidebar-tooltip-foreground': string;
  // Typography
  '--font-sans': string;
  '--font-display': string;
  '--font-mono': string;
  // Radius (used via Tailwind theme, also available as CSS vars)
  '--radius-sm': string;
  '--radius-md': string;
  '--radius-lg': string;
  '--radius-xl': string;
}

export const THEME_STORAGE_KEY = 'ttb-theme-mode';
export const BRAND_STORAGE_KEY = 'ttb-theme-brand';

const sharedLayout: Pick<
  ThemeTokens,
  | '--sidebar-width'
  | '--sidebar-width-collapsed'
  | '--font-sans'
  | '--font-display'
  | '--font-mono'
  | '--radius-sm'
  | '--radius-md'
  | '--radius-lg'
  | '--radius-xl'
> = {
  '--sidebar-width': '260px',
  '--sidebar-width-collapsed': '72px',
  '--font-sans': 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  '--font-display': 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  '--font-mono': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  '--radius-sm': '0.25rem',
  '--radius-md': '0.375rem',
  '--radius-lg': '0.5rem',
  '--radius-xl': '0.75rem'
};

export const defaultLight: ThemeTokens = {
  ...sharedLayout,
  '--color-primary': '37 99 235',
  '--color-primary-foreground': '255 255 255',
  '--color-secondary': '75 85 99',
  '--color-secondary-foreground': '255 255 255',
  '--color-accent': '59 130 246',
  '--color-accent-foreground': '255 255 255',
  '--color-background': '249 250 251',
  '--color-surface': '255 255 255',
  '--color-surface-elevated': '255 255 255',
  '--color-overlay': '0 0 0',
  '--color-foreground': '17 24 39',
  '--color-muted': '75 85 99',
  '--color-subtle': '107 114 128',
  '--color-inverse': '255 255 255',
  '--color-border': '229 231 235',
  '--color-border-strong': '209 213 219',
  '--color-success': '22 163 74',
  '--color-success-foreground': '255 255 255',
  '--color-warning': '202 138 4',
  '--color-warning-foreground': '255 255 255',
  '--color-danger': '220 38 38',
  '--color-danger-foreground': '255 255 255',
  '--color-info': '37 99 235',
  '--color-info-foreground': '255 255 255',
  '--color-focus-ring': '59 130 246',
  '--color-sidebar': '255 255 255',
  '--color-sidebar-foreground': '55 65 81',
  '--color-sidebar-muted': '107 114 128',
  '--color-sidebar-active': '243 244 246',
  '--color-sidebar-hover': '249 250 251',
  '--color-sidebar-border': '229 231 235',
  '--color-sidebar-tooltip': '31 41 55',
  '--color-sidebar-tooltip-foreground': '255 255 255'
};

export const defaultDark: ThemeTokens = {
  ...sharedLayout,
  '--color-primary': '96 165 250',
  '--color-primary-foreground': '15 23 42',
  '--color-secondary': '148 163 184',
  '--color-secondary-foreground': '15 23 42',
  '--color-accent': '59 130 246',
  '--color-accent-foreground': '255 255 255',
  '--color-background': '15 23 42',
  '--color-surface': '30 41 59',
  '--color-surface-elevated': '51 65 85',
  '--color-overlay': '0 0 0',
  '--color-foreground': '241 245 249',
  '--color-muted': '148 163 184',
  '--color-subtle': '100 116 139',
  '--color-inverse': '15 23 42',
  '--color-border': '51 65 85',
  '--color-border-strong': '71 85 105',
  '--color-success': '34 197 94',
  '--color-success-foreground': '15 23 42',
  '--color-warning': '234 179 8',
  '--color-warning-foreground': '15 23 42',
  '--color-danger': '248 113 113',
  '--color-danger-foreground': '15 23 42',
  '--color-info': '96 165 250',
  '--color-info-foreground': '15 23 42',
  '--color-focus-ring': '96 165 250',
  '--color-sidebar': '15 23 42',
  '--color-sidebar-foreground': '241 245 249',
  '--color-sidebar-muted': '148 163 184',
  '--color-sidebar-active': '30 41 59',
  '--color-sidebar-hover': '30 41 59',
  '--color-sidebar-border': '51 65 85',
  '--color-sidebar-tooltip': '241 245 249',
  '--color-sidebar-tooltip-foreground': '15 23 42'
};

/** Sample white-label brand — override primary/accent only */
export const brandAcme: Partial<ThemeTokens> = {
  '--color-primary': '124 58 237',
  '--color-primary-foreground': '255 255 255',
  '--color-accent': '139 92 246',
  '--color-accent-foreground': '255 255 255',
  '--color-focus-ring': '139 92 246',
  '--color-info': '124 58 237'
};

export const THEME_PRESETS: Record<ThemeMode, ThemeTokens> = {
  light: defaultLight,
  dark: defaultDark
};

export const BRAND_PRESETS: Record<Exclude<ThemeBrand, 'default'>, Partial<ThemeTokens>> = {
  acme: brandAcme
};

/** Runtime tenant override fields (API-driven white-label) */
export interface TenantThemeOverride {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  logoUrl?: string;
}

/** Convert hex (#rrggbb) to space-separated RGB triplet */
export function hexToRgbTriplet(hex: string): string | null {
  const normalized = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export function tokensToCssVars(tokens: Partial<ThemeTokens>): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(tokens)) {
    if (value !== undefined) {
      vars[key] = value;
    }
  }
  return vars;
}

export function tenantOverrideToCssVars(override: TenantThemeOverride): Record<string, string> {
  const vars: Record<string, string> = {};
  if (override.primaryColor) {
    const rgb = hexToRgbTriplet(override.primaryColor);
    if (rgb) {
      vars['--color-primary'] = rgb;
      vars['--color-focus-ring'] = rgb;
      vars['--color-info'] = rgb;
    }
  }
  if (override.secondaryColor) {
    const rgb = hexToRgbTriplet(override.secondaryColor);
    if (rgb) vars['--color-secondary'] = rgb;
  }
  if (override.accentColor) {
    const rgb = hexToRgbTriplet(override.accentColor);
    if (rgb) vars['--color-accent'] = rgb;
  }
  if (override.fontFamily) {
    vars['--font-sans'] = override.fontFamily;
    vars['--font-display'] = override.fontFamily;
  }
  return vars;
}
