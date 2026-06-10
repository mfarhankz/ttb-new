import type { ThemeTokens } from './theme.config';

/**
 * Color presets keyed by vertical_name (replaces legacy per-vertical SCSS bundles).
 * demo uses default blue; ota/rebogateway use legacy #141f6d primary.
 */
export type VerticalColorPreset = Pick<
  ThemeTokens,
  | '--ttb-primary'
  | '--ttb-primary-foreground'
  | '--ttb-secondary'
  | '--ttb-accent'
  | '--ttb-focus-ring'
  | '--ttb-info'
  | '--ttb-font-sans'
>;

export const VERTICAL_COLOR_PRESETS: Record<string, VerticalColorPreset> = {
  demo: {
    '--ttb-primary': '17 161 201',
    '--ttb-primary-foreground': '255 255 255',
    '--ttb-secondary': '75 85 99',
    '--ttb-accent': '17 161 201',
    '--ttb-focus-ring': '17 161 201',
    '--ttb-info': '17 161 201',
    '--ttb-font-sans':
      '"Open Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  ota: {
    '--ttb-primary': '20 31 109',
    '--ttb-primary-foreground': '255 255 255',
    '--ttb-secondary': '228 138 60',
    '--ttb-accent': '20 31 109',
    '--ttb-focus-ring': '20 31 109',
    '--ttb-info': '20 31 109',
    '--ttb-font-sans': 'DINOT, "Open Sans", ui-sans-serif, system-ui, sans-serif'
  },
  rebogateway: {
    '--ttb-primary': '20 31 109',
    '--ttb-primary-foreground': '255 255 255',
    '--ttb-secondary': '228 138 60',
    '--ttb-accent': '20 31 109',
    '--ttb-focus-ring': '20 31 109',
    '--ttb-info': '20 31 109',
    '--ttb-font-sans': 'DINOT, "Open Sans", ui-sans-serif, system-ui, sans-serif'
  }
};

export function getVerticalColorPreset(verticalName: string): VerticalColorPreset | null {
  return VERTICAL_COLOR_PRESETS[verticalName] ?? null;
}
