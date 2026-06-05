import type { ThemeTokens } from './theme.config';

/**
 * Color presets keyed by vertical_name (replaces legacy per-vertical SCSS bundles).
 * demo uses default blue; ota/rebogateway use legacy #141f6d primary.
 */
export type VerticalColorPreset = Pick<
  ThemeTokens,
  | '--color-primary'
  | '--color-primary-foreground'
  | '--color-secondary'
  | '--color-accent'
  | '--color-focus-ring'
  | '--color-info'
  | '--font-sans'
>;

export const VERTICAL_COLOR_PRESETS: Record<string, VerticalColorPreset> = {
  demo: {
    '--color-primary': '37 99 235',
    '--color-primary-foreground': '255 255 255',
    '--color-secondary': '75 85 99',
    '--color-accent': '59 130 246',
    '--color-focus-ring': '59 130 246',
    '--color-info': '37 99 235',
    '--font-sans':
      '"Open Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  ota: {
    '--color-primary': '20 31 109',
    '--color-primary-foreground': '255 255 255',
    '--color-secondary': '228 138 60',
    '--color-accent': '20 31 109',
    '--color-focus-ring': '20 31 109',
    '--color-info': '20 31 109',
    '--font-sans': 'DINOT, "Open Sans", ui-sans-serif, system-ui, sans-serif'
  },
  rebogateway: {
    '--color-primary': '20 31 109',
    '--color-primary-foreground': '255 255 255',
    '--color-secondary': '228 138 60',
    '--color-accent': '20 31 109',
    '--color-focus-ring': '20 31 109',
    '--color-info': '20 31 109',
    '--font-sans': 'DINOT, "Open Sans", ui-sans-serif, system-ui, sans-serif'
  }
};

export function getVerticalColorPreset(verticalName: string): VerticalColorPreset | null {
  return VERTICAL_COLOR_PRESETS[verticalName] ?? null;
}
