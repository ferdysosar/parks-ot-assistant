import { DataSourceConfig, DEFAULT_DATA_SOURCE_CONFIG } from '@/app/core/data/data-source-config';

type RuntimeOverrides = Partial<DataSourceConfig> & {
    mode?: DataSourceConfig['mode'];
};

declare global {
    interface Window {
        __PARKS_OT_CONFIG__?: RuntimeOverrides;
    }
}

export const appSettings: { dataSource: DataSourceConfig } = {
    dataSource: {
        ...DEFAULT_DATA_SOURCE_CONFIG,
        ...(typeof window !== 'undefined' ? window.__PARKS_OT_CONFIG__ : {})
    }
};
