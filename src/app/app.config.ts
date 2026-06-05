import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { routes } from './app.routes';
import { MapScriptsLoaderService } from './core/services/map-scripts-loader.service';
import { ThemeService } from './core/services/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    MapScriptsLoaderService,
    {
      provide: APP_INITIALIZER,
      useFactory: (loader: MapScriptsLoaderService) => () => {
        loader.load();
        return Promise.resolve();
      },
      deps: [MapScriptsLoaderService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (theme: ThemeService) => () => {
        theme.init();
        return Promise.resolve();
      },
      deps: [ThemeService],
      multi: true
    }
  ]
};
