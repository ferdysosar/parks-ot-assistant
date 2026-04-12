import {
    AssetQuery,
    CompanyQuery,
    OtCountQuery,
    OtQuery
} from "../../contracts/ot-contracts";

const OT_SORT_VALUES = new Set(["workDate", "-workDate", "otNumber", "-otNumber"]);
const GROUP_BY_VALUES = new Set(["day", "month", "year"]);

export function parseOtQuery(input: Record<string, unknown>): OtQuery {
    const sort = pickString(input.sort);
    if (sort && !OT_SORT_VALUES.has(sort)) {
        throw new Error("Parámetro 'sort' inválido.");
    }

    return {
        otNumber: pickString(input.otNumber),
        companyId: pickString(input.companyId),
        assetId: pickString(input.assetId),
        from: pickDate(input.from, "from"),
        to: pickDate(input.to, "to"),
        sort: sort as OtQuery["sort"],
        limit: pickNumber(input.limit, "limit"),
        offset: pickNumber(input.offset, "offset")
    };
}

export function parseCompanyQuery(input: Record<string, unknown>): CompanyQuery {
    return {
        search: pickString(input.search),
        limit: pickNumber(input.limit, "limit"),
        offset: pickNumber(input.offset, "offset")
    };
}

export function parseAssetQuery(input: Record<string, unknown>): AssetQuery {
    return {
        companyId: pickString(input.companyId),
        search: pickString(input.search),
        limit: pickNumber(input.limit, "limit"),
        offset: pickNumber(input.offset, "offset")
    };
}

export function parseOtCountQuery(input: Record<string, unknown>): OtCountQuery {
    const groupBy = pickString(input.groupBy);
    if (groupBy && !GROUP_BY_VALUES.has(groupBy)) {
        throw new Error("Parámetro 'groupBy' inválido.");
    }

    return {
        companyId: pickString(input.companyId),
        assetId: pickString(input.assetId),
        from: pickDate(input.from, "from"),
        to: pickDate(input.to, "to"),
        groupBy: groupBy as OtCountQuery["groupBy"]
    };
}

function pickString(value: unknown): string | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    if (typeof value !== "string") throw new Error("Parámetro de texto inválido.");
    return value;
}

function pickNumber(value: unknown, field: string): number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    const str = Array.isArray(value) ? String(value[0]) : String(value);
    const parsed = Number(str);
    if (!Number.isInteger(parsed) || parsed < 0) {
        throw new Error(`Parámetro '${field}' inválido.`);
    }
    return parsed;
}

function pickDate(value: unknown, field: string): string | undefined {
    const str = pickString(value);
    if (!str) return undefined;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        throw new Error(`Parámetro '${field}' debe tener formato YYYY-MM-DD.`);
    }
    return str;
}
