import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { appSettings } from './app/app.settings';
import { ApiOtDataSource } from '@/app/core/data/api-ot-data-source';
import { DATA_SOURCE_CONFIG } from '@/app/core/data/data-source-config';
import { LocalJsonOtDataSource } from '@/app/core/data/local-json-ot-data-source';
import { OT_DATA_SOURCE } from '@/app/core/data/ot-data-source';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(withFetch()),
        provideZonelessChangeDetection(),
        providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }),
        {
            provide: DATA_SOURCE_CONFIG,
            useValue: appSettings.dataSource
        },
        {
            provide: OT_DATA_SOURCE,
            useFactory: (
                localDataSource: LocalJsonOtDataSource,
                apiDataSource: ApiOtDataSource
            ) => (appSettings.dataSource.mode === 'api' ? apiDataSource : localDataSource),
            deps: [LocalJsonOtDataSource, ApiOtDataSource]
        },
        provideAppInitializer(() => {
            if (appSettings.dataSource.mode !== 'api') return Promise.resolve();
            return inject(ApiOtDataSource).initialize();
        })
    ]
};
