/**
 * CSS variable references for design tokens defined in src/styles.css.
 * Tailwind (@theme in styles.css) and TTBPreset (ttb-preset.ts) both read from
 * the same --ttb-* raw tokens and --form-* variables.
 */

/** rgb(var(--ttb-*)) — space-separated RGB triplets from styles.css */
export const TTB_COLOR = {
  primary: 'rgb(var(--ttb-primary))',
  primaryForeground: 'rgb(var(--ttb-primary-foreground))',
  secondary: 'rgb(var(--ttb-secondary))',
  secondaryForeground: 'rgb(var(--ttb-secondary-foreground))',
  accent: 'rgb(var(--ttb-accent))',
  accentForeground: 'rgb(var(--ttb-accent-foreground))',
  background: 'rgb(var(--ttb-background))',
  surface: 'rgb(var(--ttb-surface))',
  surfaceElevated: 'rgb(var(--ttb-surface-elevated))',
  foreground: 'rgb(var(--ttb-foreground))',
  muted: 'rgb(var(--ttb-muted))',
  subtle: 'rgb(var(--ttb-subtle))',
  inverse: 'rgb(var(--ttb-inverse))',
  border: 'rgb(var(--ttb-border))',
  borderStrong: 'rgb(var(--ttb-border-strong))',
  success: 'rgb(var(--ttb-success))',
  successForeground: 'rgb(var(--ttb-success-foreground))',
  warning: 'rgb(var(--ttb-warning))',
  warningForeground: 'rgb(var(--ttb-warning-foreground))',
  danger: 'rgb(var(--ttb-danger))',
  dangerForeground: 'rgb(var(--ttb-danger-foreground))',
  info: 'rgb(var(--ttb-info))',
  infoForeground: 'rgb(var(--ttb-info-foreground))',
  focusRing: 'rgb(var(--ttb-focus-ring))',
  overlay: 'rgb(var(--ttb-overlay))',
  overlay40: 'rgb(var(--ttb-overlay) / 0.4)',
  overlay60: 'rgb(var(--ttb-overlay) / 0.6)'
} as const;

export const TTB_RADIUS = {
  sm: 'var(--ttb-radius-sm)',
  md: 'var(--ttb-radius-md)',
  lg: 'var(--ttb-radius-lg)',
  xl: 'var(--ttb-radius-xl)'
} as const;

export const TTB_FONT = {
  sans: 'var(--ttb-font-sans)',
  display: 'var(--ttb-font-display)',
  mono: 'var(--ttb-font-mono)',
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
