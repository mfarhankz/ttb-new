import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import { TTBPreset } from '@app/shared/theme/ttb-preset';
import { MapScriptsLoaderService } from '@app/features/map/services/map-scripts-loader.service';
import { ThemeService } from '@app/core/services/theme.service';
import { VerticalService } from '@app/core/services/vertical.service';
import { partnerKeyInterceptor } from './core/interceptors/partner-key.interceptor';
import { ttbSessionInterceptor } from './core/interceptors/ttb-session.interceptor';
import { unauthorizedInterceptor } from './core/interceptors/unauthorized.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimations(),
    providePrimeNG({
      theme: {
        preset: TTBPreset,
        options: {
          darkModeSelector: '[data-theme="dark"]',
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng'
          }
        }
      }
    }),
    provideHttpClient(
      withInterceptors([ttbSessionInterceptor, partnerKeyInterceptor, unauthorizedInterceptor])
    ),
    MapScriptsLoaderService,
    {
      provide: APP_INITIALIZER,
      useFactory: (theme: ThemeService) => () => {
        theme.init();
        return Promise.resolve();
      },
      deps: [ThemeService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (vertical: VerticalService) => () => vertical.init(),
      deps: [VerticalService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (loader: MapScriptsLoaderService, vertical: VerticalService) => async () => {
        await vertical.init();
        loader.load(vertical.googleApiKey());
      },
      deps: [MapScriptsLoaderService, VerticalService],
      multi: true
    }
  ]
};
