/**
 * CSS variable references for design tokens defined in src/styles.css.
 * Tailwind (tailwind.config.js) and TTBPreset (ttb-preset.ts) both read from
 * the same --color-*, --radius-*, --font-*, and --form-* variables.
 */

/** rgb(var(--color-*)) — space-separated RGB triplets from styles.css */
export const TTB_COLOR = {
  primary: 'rgb(var(--color-primary))',
  primaryForeground: 'rgb(var(--color-primary-foreground))',
  secondary: 'rgb(var(--color-secondary))',
  secondaryForeground: 'rgb(var(--color-secondary-foreground))',
  accent: 'rgb(var(--color-accent))',
  accentForeground: 'rgb(var(--color-accent-foreground))',
  background: 'rgb(var(--color-background))',
  surface: 'rgb(var(--color-surface))',
  surfaceElevated: 'rgb(var(--color-surface-elevated))',
  foreground: 'rgb(var(--color-foreground))',
  muted: 'rgb(var(--color-muted))',
  subtle: 'rgb(var(--color-subtle))',
  inverse: 'rgb(var(--color-inverse))',
  border: 'rgb(var(--color-border))',
  borderStrong: 'rgb(var(--color-border-strong))',
  success: 'rgb(var(--color-success))',
  successForeground: 'rgb(var(--color-success-foreground))',
  warning: 'rgb(var(--color-warning))',
  warningForeground: 'rgb(var(--color-warning-foreground))',
  danger: 'rgb(var(--color-danger))',
  dangerForeground: 'rgb(var(--color-danger-foreground))',
  info: 'rgb(var(--color-info))',
  infoForeground: 'rgb(var(--color-info-foreground))',
  focusRing: 'rgb(var(--color-focus-ring))',
  overlay: 'rgb(var(--color-overlay))',
  overlay40: 'rgb(var(--color-overlay) / 0.4)',
  overlay60: 'rgb(var(--color-overlay) / 0.6)'
} as const;

export const TTB_RADIUS = {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)'
} as const;

export const TTB_FONT = {
  sans: 'var(--font-sans)',
  display: 'var(--font-display)',
  mono: 'var(--font-mono)',
  sizeBody: 'var(--font-size-body)',
  sizeBodySm: 'var(--font-size-body-sm)',
  sizeCaption: 'var(--font-size-caption)',
  lineHeightBody: 'var(--line-height-body)',
  lineHeightBodySm: 'var(--line-height-body-sm)',
  lineHeightCaption: 'var(--line-height-caption)'
} as const;

export const TTB_FORM = {
  paddingX: 'var(--form-padding-x)',
  paddingY: 'var(--form-padding-y)',
  paddingXSm: 'var(--form-padding-x-sm)',
  paddingYSm: 'var(--form-padding-y-sm)',
  paddingXLg: 'var(--form-padding-x-lg)',
  paddingYLg: 'var(--form-padding-y-lg)'
} as const;

/** Shared color scheme — light/dark values come from styles.css [data-theme] selectors. */
export function ttbColorScheme() {
  const c = TTB_COLOR;

  return {
    primary: {
      color: c.primary,
      contrastColor: c.primaryForeground,
      hoverColor: c.primary,
      activeColor: c.primary
    },
    highlight: {
      background: `color-mix(in srgb, ${c.primary} 12%, ${c.surface})`,
      focusBackground: `color-mix(in srgb, ${c.primary} 18%, ${c.surface})`,
      color: c.primary,
      focusColor: c.primary
    },
    surface: {
      0: c.surface,
      50: c.background,
      100: c.border,
      200: c.borderStrong,
      300: c.borderStrong,
      400: c.muted,
      500: c.subtle,
      600: c.muted,
      700: c.foreground,
      800: c.foreground,
      900: c.foreground,
      950: c.foreground
    },
    text: {
      color: c.foreground,
      hoverColor: c.foreground,
      mutedColor: c.muted,
      hoverMutedColor: c.subtle
    },
    content: {
      background: c.surface,
      hoverBackground: c.background,
      borderColor: c.border,
      color: c.foreground,
      hoverColor: c.foreground
    },
    formField: {
      background: c.surface,
      disabledBackground: c.border,
      filledBackground: c.background,
      filledHoverBackground: c.background,
      filledFocusBackground: c.background,
      borderColor: c.border,
      hoverBorderColor: c.borderStrong,
      focusBorderColor: c.primary,
      invalidBorderColor: c.danger,
      color: c.foreground,
      disabledColor: c.subtle,
      placeholderColor: c.subtle,
      invalidPlaceholderColor: c.danger,
      floatLabelColor: c.subtle,
      floatLabelFocusColor: c.primary,
      floatLabelActiveColor: c.subtle,
      iconColor: c.muted
    },
    overlay: {
      select: {
        background: c.surface,
        borderColor: c.border,
        color: c.foreground
      },
      popover: {
        background: c.surface,
        borderColor: c.border,
        color: c.foreground
      },
      modal: {
        background: c.surface,
        borderColor: c.border,
        color: c.foreground
      }
    },
    list: {
      option: {
        focusBackground: c.background,
        selectedBackground: `color-mix(in srgb, ${c.primary} 12%, ${c.surface})`,
        selectedFocusBackground: `color-mix(in srgb, ${c.primary} 18%, ${c.surface})`,
        color: c.foreground,
        focusColor: c.foreground,
        selectedColor: c.primary,
        selectedFocusColor: c.primary,
        icon: {
          color: c.muted,
          focusColor: c.subtle
        }
      },
      optionGroup: {
        color: c.muted
      }
    },
    navigation: {
      item: {
        focusBackground: c.background,
        activeBackground: c.background,
        color: c.foreground,
        focusColor: c.foreground,
        activeColor: c.foreground,
        icon: {
          color: c.muted,
          focusColor: c.subtle,
          activeColor: c.subtle
        }
      },
      submenuLabel: {
        color: c.muted
      },
      submenuIcon: {
        color: c.muted,
        focusColor: c.subtle,
        activeColor: c.subtle
      }
    },
    mask: {
      background: c.overlay40,
      color: c.border
    }
  };
}
