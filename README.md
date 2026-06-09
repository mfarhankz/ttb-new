# Title Toolbox New

A modern Angular application for title management with Multi-Factor Authentication (MFA) support.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [Building](#building)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Configuration](#configuration)
- [Additional Resources](#additional-resources)

## 🎯 Project Overview

Title Toolbox New is a comprehensive Angular-based application for title management. It features a secure authentication system with Multi-Factor Authentication (MFA), user profile management, and a modern, responsive UI built with TailwindCSS and PrimeNG.

## 🛠 Technology Stack

### Core Framework
- **Angular**: `^21.2.16` - Modern web application framework
- **TypeScript**: `~5.9.3` - Typed superset of JavaScript
- **Node.js**: `v20.19.0+` recommended (`v24.x` supported)
- **npm**: `11.10.0` (see `packageManager` in `package.json`)

### Angular Packages
- `@angular/animations`: `^21.2.16` - Animation library
- `@angular/common`: `^21.2.16` - Common utilities
- `@angular/compiler`: `^21.2.16` - Template compiler
- `@angular/core`: `^21.2.16` - Core framework
- `@angular/forms`: `^21.2.16` - Forms module
- `@angular/platform-browser`: `^21.2.16` - Browser platform
- `@angular/router`: `^21.2.16` - Routing module
- `@angular/cli`: `^21.2.14` - Command-line interface
- `@angular/build`: `^21.2.14` - Build system
- `@angular/compiler-cli`: `^21.2.16` - Compiler CLI

### UI Libraries
- **PrimeNG**: `^21.1.9` - UI component library
- **@primeuix/themes**: `^2.0.3` - PrimeNG theme presets (Aura-based TTB preset)
- **PrimeIcons**: `^7.0.0` - Icon library
- **Tailwind CSS**: `^4.3.0` - Utility-first CSS framework (CSS-first config)
- **tailwindcss-primeui**: `^0.6.1` - PrimeUI Tailwind plugin
- **OpenLayers (ol)**: `^10.9.0` - Map rendering

### Styling & Build Tools
- **@tailwindcss/postcss**: `^4.3.0` - Tailwind v4 PostCSS plugin (required for `ng build` / `ng serve`)
- **PostCSS**: `^8.5.15` - CSS transformation tool

### Reactive Programming
- **RxJS**: `~7.8.0` - Reactive extensions for JavaScript

### Testing
- **Vitest**: `^4.1.8` - Fast unit test framework
- **jsdom**: `^28.1.0` - DOM implementation for Node.js

### Utilities
- **tslib**: `^2.8.0` - TypeScript runtime library

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: `v20.19.0` or higher (recommended: `v24.5.0`)
- **npm**: `11.10.0` or higher
- **Angular CLI**: `^21.2.14` (installed globally or via npx)

### Verify Installation

```bash
node --version    # Should be v20.19.0 or higher
npm --version     # Should be 11.5.1 or higher
ng version        # Should be 21.2.x
```

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:mfarhankz/ttb-new.git
   cd ttb-new
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment** (if needed)
   - Copy `.env.example` to `.env` and set `TTB_DEV_EMAIL` and `TTB_DEV_PASSWORD` for local login form defaults (optional; never commit `.env`).
   - Update API endpoints in `src/app/core/config/api.config.ts`
   - Adjust development flags as needed

## 💻 Development

### Start Development Server

To start a local development server with hot-reload:

```bash
npm start
# or
ng serve
```

Once the server is running, open your browser and navigate to:
- **Local**: `http://localhost:4200/`
- The application will automatically reload whenever you modify any of the source files.

### Development Flags

The application includes development flags for easier testing (configured in `src/app/core/config/api.config.ts`):

- `DISABLE_MFA_IN_DEV`: Skip MFA flow in development mode
- `SKIP_LOGIN_IN_DEV`: Auto-login with default credentials
- `SKIP_PHONE_REGISTER_IN_DEV`: Auto-register phone with default number

## 🏗 Building

### Development Build

```bash
npm run build
# or
ng build
```

### Production Build

```bash
ng build --configuration production
```

This will compile your project and store the build artifacts in the `dist/` directory. The production build optimizes your application for performance and speed.

### Watch Mode

```bash
npm run watch
# or
ng build --watch --configuration development
```

## 🧪 Testing

### Unit Tests

To execute unit tests with [Vitest](https://vitest.dev/):

```bash
npm test
# or
ng test
```

### End-to-End Tests

For end-to-end (e2e) testing:

```bash
ng e2e
```

> **Note**: Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## 📁 Project Structure

```
titletoolbox-new/
├── src/
│   ├── app/
│   │   ├── core/                    # Core services, guards, config
│   │   │   ├── config/             # Configuration files
│   │   │   │   └── api.config.ts   # API endpoints & dev flags
│   │   │   ├── guards/             # Route guards
│   │   │   │   └── auth.guard.ts   # Authentication guard
│   │   │   ├── interfaces/         # TypeScript interfaces
│   │   │   │   └── api.interface.ts
│   │   │   └── services/           # Core services
│   │   │       ├── api.service.ts  # Generic HTTP service
│   │   │       └── auth.service.ts # Authentication service
│   │   ├── layouts/                 # Layout components
│   │   │   ├── authenticated-layout/
│   │   │   └── public-layout/
│   │   ├── pages/                   # Page components
│   │   │   ├── authenticated/      # Protected pages
│   │   │   │   ├── dashboard/
│   │   │   │   └── profile/
│   │   │   └── public/             # Public pages
│   │   │       ├── home/
│   │   │       ├── login/
│   │   │       └── mfa/            # MFA components
│   │   │           ├── mfa-otp-verify/
│   │   │           └── mfa-phone-register/
│   │   ├── shared/                 # Shared components
│   │   │   └── components/        # Reusable UI components
│   │   │       ├── alert/
│   │   │       ├── button/
│   │   │       ├── card/
│   │   │       ├── checkbox/
│   │   │       ├── form-field/
│   │   │       ├── input/
│   │   │       ├── label/
│   │   │       ├── modal/
│   │   │       ├── radio/
│   │   │       ├── select/
│   │   │       └── textarea/
│   │   ├── app.config.ts           # App configuration
│   │   ├── app.routes.ts           # Route definitions
│   │   └── app.ts                  # Root component
│   ├── styles.css                  # Global styles
│   ├── index.html                  # HTML entry point
│   └── main.ts                     # Application bootstrap
├── public/                          # Static assets
├── angular.json                    # Angular configuration
├── .postcssrc.json                 # PostCSS config (Angular reads JSON only)
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # This file
```

## ✨ Key Features

### 🔐 Authentication & Security
- **Multi-Factor Authentication (MFA)**: Phone-based OTP verification
- **Secure Token Management**: JWT token storage and validation
- **Route Guards**: Protected routes for authenticated users
- **Session Management**: Automatic session restoration

### 📱 User Interface
- **Responsive Design**: Mobile-first approach with TailwindCSS
- **Component Library**: PrimeNG components with TailwindCSS styling
- **Reusable Components**: Shared UI component library
- **Modern Layout**: Clean, professional interface

### 🎨 Styling
- **Tailwind CSS v4**: CSS-first setup in `src/styles.css` (`@import`, `@theme`, `@plugin`)
- **Design tokens**: Raw `--ttb-*` variables in `styles.css`; Tailwind utilities map via `@theme`
- **PrimeNG integration**: `tailwindcss-primeui` plugin + `cssLayer` in `app.config.ts`
- **White-label theming**: `ThemeService` and `theme.config.ts` override `--ttb-*` tokens at runtime
- **Custom components**: Abstraction layer for easy UI library swapping

### 🔄 State Management
- **Angular Signals**: Reactive state management
- **RxJS Observables**: Asynchronous data handling
- **LocalStorage**: Persistent user data storage

### 🛣 Routing
- **Lazy Loading**: Code splitting for optimal performance
- **Route Guards**: Authentication-based route protection
- **Nested Routes**: Hierarchical routing structure

## ⚙️ Configuration

### Login form defaults (.env)

To prefill the login form in development without putting credentials in code:

1. Copy `.env.example` to `.env`.
2. Set `TTB_DEV_EMAIL` and `TTB_DEV_PASSWORD` in `.env` (optional).
3. Run `npm run generate-login-defaults` or start the app with `npm start` (script runs automatically).

The file `src/environments/login-defaults.generated.ts` is generated from `.env`. Never commit `.env`; if you run the script with real credentials in `.env`, do not commit the generated file (revert it to the empty default before committing).

### API Configuration

API endpoints are configured in `src/app/core/config/api.config.ts`:

```typescript
export const API_CONFIG = {
  baseUrl: 'https://demo.api.titletoolbox.com/webservices',
  endpoints: {
    login: '/login.json',
    sendMfaOtp: '/send_mfa_otp.json',
    verifyMfaOtp: '/verify_mfa_otp.json'
  }
}
```

### Development Flags

Development flags can be configured in `src/app/core/config/api.config.ts`:

```typescript
export const DISABLE_MFA_IN_DEV = true;  // Skip MFA in development
export const SKIP_LOGIN_IN_DEV = false;   // Auto-login in development
export const SKIP_PHONE_REGISTER_IN_DEV = false; // Auto-register phone
```

### Map (OpenLayers + Google Maps)

- **Libraries**: OpenLayers (`ol` npm package) for the main map; Google Maps JavaScript API v3 with Places for geocoding and address autocomplete.
- **Load order**: Google Maps loads first (async); OpenLayers follows. Maps initialize only after both are ready (`MapScriptsLoaderService.whenReady()`).
- **Config**: Defaults (center, zoom, etc.) live in `src/app/core/config/map.config.ts`. Set `MAP_CONFIG.googleMapsApiKey` or `window.__GOOGLE_MAPS_API_KEY__` for geocoding/Places.

### Tailwind CSS v4 Configuration

Tailwind uses a **CSS-first** setup. There is no `tailwind.config.js`.

**PostCSS** (`.postcssrc.json` — Angular only loads JSON PostCSS configs):

```json
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```

**Global styles** (`src/styles.css`):

```css
@import 'tailwindcss';
@plugin 'tailwindcss-primeui';
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

@theme {
  --color-primary: rgb(var(--ttb-primary));
  /* ...semantic colors, typography, spacing... */
}
```

**Design tokens**

| Layer | Purpose | Example |
|-------|---------|---------|
| `--ttb-*` in `:root` | Raw RGB channels / fonts / radius (runtime theme overrides) | `--ttb-primary: 37 99 235` |
| `@theme` | Tailwind utility tokens | `bg-primary` → `var(--color-primary)` |
| `theme.config.ts` | Light/dark/brand presets applied by `ThemeService` | Sets `--ttb-*` on `documentElement` |

PrimeNG layer order is set in `src/app/app.config.ts`:

```typescript
providePrimeNG({
  theme: {
    preset: TTBPreset,
    options: {
      darkModeSelector: '[data-theme="dark"]',
      cssLayer: { name: 'primeng', order: 'theme, base, primeng' }
    }
  }
})
```

Use semantic utilities in templates (`text-foreground`, `bg-primary`, `text-body-sm`) — not raw palette classes (`gray-*`, `blue-*`).

## 📚 Code Scaffolding

Angular CLI includes powerful code scaffolding tools:

### Generate a Component
```bash
ng generate component component-name
```

### Generate a Service
```bash
ng generate service service-name
```

### Generate a Guard
```bash
ng generate guard guard-name
```

### Complete List of Schematics
```bash
ng generate --help
```

Available schematics include:
- `component` - Angular component
- `directive` - Angular directive
- `pipe` - Angular pipe
- `service` - Angular service
- `guard` - Route guard
- `interface` - TypeScript interface
- `enum` - TypeScript enum

## 🔧 Scripts

Available npm scripts:

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run watch` - Build in watch mode
- `npm test` - Run unit tests
- `ng serve` - Start development server (alternative)
- `ng build` - Build the project (alternative)

## 📖 Additional Resources

- [Angular Documentation](https://angular.dev)
- [Angular CLI Overview](https://angular.dev/tools/cli)
- [PrimeNG Documentation](https://primeng.org)
- [TailwindCSS Documentation](https://tailwindcss.com)
- [RxJS Documentation](https://rxjs.dev)
- [TypeScript Documentation](https://www.typescriptlang.org)
- [Vitest Documentation](https://vitest.dev)

## 📝 License

This project is private and proprietary.

## 👥 Contributors

- Development Team

## 📞 Support

For support and questions, please contact the development team.

---

**Last Updated**: June 2025  
**Version**: 0.0.0  
**Angular Version**: 21.2.x · **Tailwind CSS**: 4.3.x
