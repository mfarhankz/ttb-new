/**
 * TTB PrimeNG theme preset — extends Aura.
 *
 * Colors, radius, typography, and form spacing reference CSS variables from
 * src/styles.css (same source as tailwind.config.js). Edit styles.css to
 * change the look site-wide.
 */
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { TTB_COLOR, TTB_FONT, TTB_FORM, TTB_RADIUS, ttbColorScheme } from './ttb-token-vars';

const scheme = ttbColorScheme();

export const TTBPreset = definePreset(Aura, {
  primitive: {
    borderRadius: {
      sm: TTB_RADIUS.sm,
      md: TTB_RADIUS.md,
      lg: TTB_RADIUS.lg,
      xl: TTB_RADIUS.xl
    }
  },
  semantic: {
    focusRing: {
      color: TTB_COLOR.focusRing
    },
    iconSize: TTB_FONT.sizeBody,
    formField: {
      paddingX: TTB_FORM.paddingX,
      paddingY: TTB_FORM.paddingY,
      borderRadius: TTB_RADIUS.md,
      sm: {
        fontSize: TTB_FONT.sizeBodySm,
        paddingX: TTB_FORM.paddingXSm,
        paddingY: TTB_FORM.paddingYSm
      },
      lg: {
        fontSize: TTB_FONT.sizeBody,
        paddingX: TTB_FORM.paddingXLg,
        paddingY: TTB_FORM.paddingYLg
      }
    },
    content: {
      borderRadius: TTB_RADIUS.md
    },
    list: {
      option: {
        padding: `${TTB_FORM.paddingYSm} ${TTB_FORM.paddingX}`,
        borderRadius: TTB_RADIUS.sm
      }
    },
    navigation: {
      item: {
        padding: `${TTB_FORM.paddingYSm} ${TTB_FORM.paddingX}`,
        borderRadius: TTB_RADIUS.sm
      }
    },
    colorScheme: {
      light: scheme,
      dark: scheme
    }
  },
  components: {
    select: {
      root: {
        sm: {
          fontSize: TTB_FONT.sizeBodySm, // 0.875rem — use size="small" on <p-select>
          paddingX: TTB_FORM.paddingXSm,
          paddingY: TTB_FORM.paddingYSm
        }
      },
      option: {
        padding: `${TTB_FORM.paddingYSm} ${TTB_FORM.paddingX}`
      },
      css: `
        .p-select-overlay {
          font-size: ${TTB_FONT.sizeBodySm};
        }
      `
    },
    inputtext: {
      root: {
        sm: {
          fontSize: TTB_FONT.sizeBodySm
        }
      }
    },
    menu: {
      root: {
        borderRadius: TTB_RADIUS.md
      },
      item: {
        padding: `${TTB_FORM.paddingYSm} ${TTB_FORM.paddingX}`,
        borderRadius: TTB_RADIUS.sm,
        gap: TTB_FORM.paddingYSm
      },
      css: `
        .p-menu,
        .p-menu-overlay {
          font-size: ${TTB_FONT.sizeBodySm};
        }
        .p-menu-item-icon {
          font-size: 1em;
        }
        .p-menu-item-label {
          line-height: var(--line-height-body-sm);
        }
      `
    },
    toggleswitch: {
      root: {
        gap: TTB_FORM.paddingYSm
      }
    }
  }
});
