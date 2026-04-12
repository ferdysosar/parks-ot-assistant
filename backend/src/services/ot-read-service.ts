import {
    AssetQuery,
    CompanyQuery,
    OtCountQuery,
    OtQuery
} from "../contracts/ot-contracts";
import { OtRepository } from "../repositories/ot-repository";

export class OtReadService {
    constructor(private readonly repository: OtRepository) {}

    queryOts(query?: OtQuery) {
        return this.repository.queryOts(query);
    }

    queryCompanies(query?: CompanyQuery) {
        return this.repository.queryCompanies(query);
    }

    queryAssets(query?: AssetQuery) {
        return this.repository.queryAssets(query);
    }

    countOts(query?: OtCountQuery) {
        return this.repository.countOts(query);
    }
}
