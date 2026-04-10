import { InjectionToken } from '@angular/core';
import {
    AssetDto,
    AssetQuery,
    CompanyDto,
    CompanyQuery,
    OtCountDto,
    OtCountQuery,
    OtDto,
    OtQuery,
    PagedResponse
} from './ot-contracts';

export interface OtDataSource {
    queryOts(query?: OtQuery): PagedResponse<OtDto>;
    getOtByNumber(otNumber: string): OtDto | null;
    queryCompanies(query?: CompanyQuery): PagedResponse<CompanyDto>;
    queryAssets(query?: AssetQuery): PagedResponse<AssetDto>;
    countOts(query?: OtCountQuery): OtCountDto;
    getChatSnapshot(): {
        ots: OtDto[];
        companies: CompanyDto[];
        assets: AssetDto[];
    };
}

export const OT_DATA_SOURCE = new InjectionToken<OtDataSource>('OT_DATA_SOURCE');
