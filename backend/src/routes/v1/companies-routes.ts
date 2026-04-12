import { FastifyInstance } from "fastify";
import { OtReadService } from "../../services/ot-read-service";
import { parseCompanyQuery } from "./query-parsers";

export async function registerCompanyRoutes(app: FastifyInstance, service: OtReadService): Promise<void> {
    app.get("/companies", async (request, reply) => {
        try {
            const query = parseCompanyQuery(request.query as Record<string, unknown>);
            return await service.queryCompanies(query);
        } catch (error) {
            return reply.status(400).send({
                error: (error as Error).message
            });
        }
    });
}
