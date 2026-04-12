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
} from "../contracts/ot-contracts";

export interface OtRepository {
    queryOts(query?: OtQuery): PagedResponse<OtDto>;
    getOtByNumber(otNumber: string): OtDto | null;
    queryCompanies(query?: CompanyQuery): PagedResponse<CompanyDto>;
    queryAssets(query?: AssetQuery): PagedResponse<AssetDto>;
    countOts(query?: OtCountQuery): OtCountDto;
}
