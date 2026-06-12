/**
 * Design token presets for white-label theming.
 *
 * Conventions:
 * - Use semantic Tailwind classes in app code (text-foreground, bg-primary, text-h1).
 * - Do NOT use raw palette classes (gray-*, blue-*, etc.) in components.
 * - Raw tokens use --ttb-* (space-separated RGB triplets). Tailwind @theme maps them to utilities.
 */

export type ThemeMode = 'light' | 'dark';
export type ThemeVariant = 'light' | 'dark' | 'main';
export type ThemeBrand = 'default' | 'acme';

export interface ThemeTokens {
  // Brand
  '--ttb-primary': string;
  '--ttb-primary-foreground': string;
  '--ttb-secondary': string;
  '--ttb-secondary-foreground': string;
  '--ttb-accent': string;
  '--ttb-accent-foreground': string;
  // Surfaces
  '--ttb-background': string;
  '--ttb-surface': string;
  '--ttb-surface-elevated': string;
  '--ttb-overlay': string;
  // Text
  '--ttb-foreground': string;
  '--ttb-muted': string;
  '--ttb-subtle': string;
  '--ttb-inverse': string;
  // Borders
  '--ttb-border': string;
  '--ttb-border-strong': string;
  // States
  '--ttb-success': string;
  '--ttb-success-foreground': string;
  '--ttb-warning': string;
  '--ttb-warning-foreground': string;
  '--ttb-danger': string;
  '--ttb-danger-foreground': string;
  '--ttb-info': string;
  '--ttb-info-foreground': string;
  // Focus
  '--ttb-focus-ring': string;
  // Sidebar
  '--sidebar-width': string;
  '--sidebar-width-collapsed': string;
  '--ttb-sidebar': string;
  '--ttb-sidebar-foreground': string;
  '--ttb-sidebar-muted': string;
  '--ttb-sidebar-active': string;
  '--ttb-sidebar-hover': string;
  '--ttb-sidebar-border': string;
  '--ttb-sidebar-tooltip': string;
  '--ttb-sidebar-tooltip-foreground': string;
  // Typography
  '--ttb-font-sans': string;
  '--ttb-font-display': string;
  '--ttb-font-mono': string;
  // Radius (used via Tailwind theme, also available as CSS vars)
  '--ttb-radius-sm': string;
  '--ttb-radius-md': string;
  '--ttb-radius-lg': string;
  '--ttb-radius-xl': string;
}

export const THEME_STORAGE_KEY = 'ttb-theme-mode';
export const VARIANT_STORAGE_KEY = 'ttb-theme-variant';
export const BRAND_STORAGE_KEY = 'ttb-theme-brand';
export const FONT_FAMILY_STORAGE_KEY = 'ttb-theme-font-family';

export type ThemeFontFamily =
  | 'default'
  | 'inter'
  | 'dm-sans'
  | 'plus-jakarta-sans'
  | 'work-sans'
  | 'open-sans'
  | 'source-sans-3';

export interface FontFamilyOption {
  id: ThemeFontFamily;
  label: string;
  description: string;
  stack?: string;
  googleFontsUrl?: string;
}

const SYSTEM_FONT_STACK =
  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

function googleFontUrl(family: string, weights = '400;500;600;700'): string {
  return `https://fonts.googleapis.com/css2?family=${family}:wght@${weights}&display=swap`;
}

function fontOption(
  id: ThemeFontFamily,
  label: string,
  description: string,
  familyName: string,
  weights?: string
): FontFamilyOption {
  return {
    id,
    label,
    description,
    stack: `"${familyName}", ${SYSTEM_FONT_STACK}`,
    googleFontsUrl: googleFontUrl(familyName.replace(/ /g, '+'), weights)
  };
}

/** Top dashboard UI fonts + inherit theme/vertical default. */
export const FONT_FAMILY_OPTIONS: ReadonlyArray<FontFamilyOption> = [
  {
    id: 'default',
    label: 'Default',
    description: 'Use your theme or vertical font'
  },
  fontOption('inter', 'Inter', 'Best all-round dashboard font — crisp at every size', 'Inter'),
  fontOption('dm-sans', 'DM Sans', 'Geometric and calm — great for dense data layouts', 'DM Sans'),
  fontOption(
    'plus-jakarta-sans',
    'Plus Jakarta Sans',
    'Modern SaaS look — popular for analytics dashboards',
    'Plus Jakarta Sans'
  ),
  fontOption('work-sans', 'Work Sans', 'Built for screens — strong table and label readability', 'Work Sans'),
  fontOption('open-sans', 'Open Sans', 'Highly legible — safe choice for long dashboard sessions', 'Open Sans'),
  fontOption(
    'source-sans-3',
    'Source Sans 3',
    'Professional enterprise feel — excellent for mixed text and numbers',
    'Source Sans 3'
  )
];

export const VALID_FONT_FAMILIES = new Set<ThemeFontFamily>(FONT_FAMILY_OPTIONS.map((option) => option.id));

const sharedLayout: Pick<
  ThemeTokens,
  | '--sidebar-width'
  | '--sidebar-width-collapsed'
  | '--ttb-font-sans'
  | '--ttb-font-display'
  | '--ttb-font-mono'
  | '--ttb-radius-sm'
  | '--ttb-radius-md'
  | '--ttb-radius-lg'
  | '--ttb-radius-xl'
> = {
  '--sidebar-width': '260px',
  '--sidebar-width-collapsed': '72px',
  '--ttb-font-sans': 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  '--ttb-font-display': 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  '--ttb-font-mono': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  '--ttb-radius-sm': '0.25rem',
  '--ttb-radius-md': '0.375rem',
  '--ttb-radius-lg': '0.5rem',
  '--ttb-radius-xl': '0.75rem'
};

/** Classic light theme — white sidebar */
export const classicLight: ThemeTokens = {
  ...sharedLayout,
  '--ttb-primary': '17 161 201',
  '--ttb-primary-foreground': '255 255 255',
  '--ttb-secondary': '75 85 99',
  '--ttb-secondary-foreground': '255 255 255',
  '--ttb-accent': '17 161 201',
  '--ttb-accent-foreground': '255 255 255',
  '--ttb-background': '249 250 251',
  '--ttb-surface': '255 255 255',
  '--ttb-surface-elevated': '255 255 255',
  '--ttb-overlay': '0 0 0',
  '--ttb-foreground': '17 24 39',
  '--ttb-muted': '75 85 99',
  '--ttb-subtle': '107 114 128',
  '--ttb-inverse': '255 255 255',
  '--ttb-border': '229 231 235',
  '--ttb-border-strong': '209 213 219',
  '--ttb-success': '62 197 147',
  '--ttb-success-foreground': '255 255 255',
  '--ttb-warning': '202 138 4',
  '--ttb-warning-foreground': '255 255 255',
  '--ttb-danger': '236 80 80',
  '--ttb-danger-foreground': '255 255 255',
  '--ttb-info': '17 161 201',
  '--ttb-info-foreground': '255 255 255',
  '--ttb-focus-ring': '17 161 201',
  '--ttb-sidebar': '255 255 255',
  '--ttb-sidebar-foreground': '55 65 81',
  '--ttb-sidebar-muted': '107 114 128',
  '--ttb-sidebar-active': '243 244 246',
  '--ttb-sidebar-hover': '249 250 251',
  '--ttb-sidebar-border': '229 231 235',
  '--ttb-sidebar-tooltip': '31 41 55',
  '--ttb-sidebar-tooltip-foreground': '255 255 255'
};

/** Default branded light theme — navy sidebar */
export const defaultLight: ThemeTokens = {
  ...sharedLayout,
  '--ttb-primary': '17 161 201',
  '--ttb-primary-foreground': '255 255 255',
  '--ttb-secondary': '75 85 99',
  '--ttb-secondary-foreground': '255 255 255',
  '--ttb-accent': '17 161 201',
  '--ttb-accent-foreground': '255 255 255',
  '--ttb-background': '249 250 251',
  '--ttb-surface': '255 255 255',
  '--ttb-surface-elevated': '255 255 255',
  '--ttb-overlay': '0 0 0',
  '--ttb-foreground': '17 24 39',
  '--ttb-muted': '75 85 99',
  '--ttb-subtle': '107 114 128',
  '--ttb-inverse': '255 255 255',
  '--ttb-border': '229 231 235',
  '--ttb-border-strong': '209 213 219',
  '--ttb-success': '62 197 147',
  '--ttb-success-foreground': '255 255 255',
  '--ttb-warning': '202 138 4',
  '--ttb-warning-foreground': '255 255 255',
  '--ttb-danger': '236 80 80',
  '--ttb-danger-foreground': '255 255 255',
  '--ttb-info': '17 161 201',
  '--ttb-info-foreground': '255 255 255',
  '--ttb-focus-ring': '17 161 201',
  '--ttb-sidebar': '30 41 59',
  '--ttb-sidebar-foreground': '241 245 249',
  '--ttb-sidebar-muted': '148 163 184',
  '--ttb-sidebar-active': '51 65 85',
  '--ttb-sidebar-hover': '51 65 85',
  '--ttb-sidebar-border': '51 65 85',
  '--ttb-sidebar-tooltip': '241 245 249',
  '--ttb-sidebar-tooltip-foreground': '15 23 42'
};

export const defaultDark: ThemeTokens = {
  ...sharedLayout,
  '--ttb-primary': '60 192 228',
  '--ttb-primary-foreground': '15 23 42',
  '--ttb-secondary': '148 163 184',
  '--ttb-secondary-foreground': '15 23 42',
  '--ttb-accent': '60 192 228',
  '--ttb-accent-foreground': '255 255 255',
  '--ttb-background': '15 23 42',
  '--ttb-surface': '30 41 59',
  '--ttb-surface-elevated': '51 65 85',
  '--ttb-overlay': '0 0 0',
  '--ttb-foreground': '241 245 249',
  '--ttb-muted': '148 163 184',
  '--ttb-subtle': '100 116 139',
  '--ttb-inverse': '15 23 42',
  '--ttb-border': '51 65 85',
  '--ttb-border-strong': '71 85 105',
  '--ttb-success': '62 197 147',
  '--ttb-success-foreground': '15 23 42',
  '--ttb-warning': '234 179 8',
  '--ttb-warning-foreground': '15 23 42',
  '--ttb-danger': '236 80 80',
  '--ttb-danger-foreground': '15 23 42',
  '--ttb-info': '60 192 228',
  '--ttb-info-foreground': '15 23 42',
  '--ttb-focus-ring': '60 192 228',
  '--ttb-sidebar': '15 23 42',
  '--ttb-sidebar-foreground': '241 245 249',
  '--ttb-sidebar-muted': '148 163 184',
  '--ttb-sidebar-active': '30 41 59',
  '--ttb-sidebar-hover': '30 41 59',
  '--ttb-sidebar-border': '51 65 85',
  '--ttb-sidebar-tooltip': '241 245 249',
  '--ttb-sidebar-tooltip-foreground': '15 23 42'
};

/** Sample white-label brand — override primary/accent only */
export const brandAcme: Partial<ThemeTokens> = {
  '--ttb-primary': '124 58 237',
  '--ttb-primary-foreground': '255 255 255',
  '--ttb-accent': '139 92 246',
  '--ttb-accent-foreground': '255 255 255',
  '--ttb-focus-ring': '139 92 246',
  '--ttb-info': '124 58 237'
};

export const THEME_PRESETS: Record<ThemeMode, ThemeTokens> = {
  light: defaultLight,
  dark: defaultDark
};

export const VARIANT_PRESETS: Record<ThemeVariant, { mode: ThemeMode; tokens: ThemeTokens }> = {
  main: { mode: 'light', tokens: defaultLight },
  light: { mode: 'light', tokens: classicLight },
  dark: { mode: 'dark', tokens: defaultDark }
};

export const THEME_VARIANT_OPTIONS: ReadonlyArray<{
  id: ThemeVariant;
  label: string;
  description: string;
}> = [
  {
    id: 'main',
    label: 'Main',
    description: 'Default branded look with navy sidebar'
  },
  {
    id: 'light',
    label: 'Light',
    description: 'Classic light interface with white sidebar'
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Dark mode for low-light environments'
  }
];

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

export function getFontFamilyOption(id: ThemeFontFamily): FontFamilyOption {
  return FONT_FAMILY_OPTIONS.find((option) => option.id === id) ?? FONT_FAMILY_OPTIONS[0];
}

/** CSS variables for a user-selected font (null when inheriting theme/vertical default). */
export function fontFamilyToCssVars(id: ThemeFontFamily): Record<string, string> | null {
  if (id === 'default') {
    return null;
  }

  const option = getFontFamilyOption(id);
  if (!option.stack) {
    return null;
  }

  return {
    '--ttb-font-sans': option.stack,
    '--ttb-font-display': option.stack
  };
}

export function tenantOverrideToCssVars(override: TenantThemeOverride): Record<string, string> {
  const vars: Record<string, string> = {};
  if (override.primaryColor) {
    const rgb = hexToRgbTriplet(override.primaryColor);
    if (rgb) {
      vars['--ttb-primary'] = rgb;
      vars['--ttb-focus-ring'] = rgb;
      vars['--ttb-info'] = rgb;
    }
  }
  if (override.secondaryColor) {
    const rgb = hexToRgbTriplet(override.secondaryColor);
    if (rgb) vars['--ttb-secondary'] = rgb;
  }
  if (override.accentColor) {
    const rgb = hexToRgbTriplet(override.accentColor);
    if (rgb) vars['--ttb-accent'] = rgb;
  }
  if (override.fontFamily) {
    vars['--ttb-font-sans'] = override.fontFamily;
    vars['--ttb-font-display'] = override.fontFamily;
  }
  return vars;
}
