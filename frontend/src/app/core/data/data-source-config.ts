import { InjectionToken } from '@angular/core';

export type DataSourceMode = 'local' | 'api';

export interface DataSourceConfig {
    mode: DataSourceMode;
    apiBaseUrl: string;
    fallbackToLocalOnApiError: boolean;
    requestTimeoutMs: number;
}

export const DEFAULT_DATA_SOURCE_CONFIG: DataSourceConfig = {
    mode: 'local',
    apiBaseUrl: 'http://localhost:3001/api/v1',
    fallbackToLocalOnApiError: true,
    requestTimeoutMs: 4000
};

export const DATA_SOURCE_CONFIG = new InjectionToken<DataSourceConfig>('DATA_SOURCE_CONFIG');
