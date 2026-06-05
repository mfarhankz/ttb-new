import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { MapScriptsLoaderService } from './core/services/map-scripts-loader.service';
import { ThemeService } from './core/services/theme.service';
import { VerticalService } from './core/services/vertical.service';
import { partnerKeyInterceptor } from './core/interceptors/partner-key.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([partnerKeyInterceptor])),
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
      useFactory: (loader: MapScriptsLoaderService) => () => {
        loader.load();
        return Promise.resolve();
      },
      deps: [MapScriptsLoaderService],
      multi: true
    }
  ]
};
