import { FastifyInstance } from "fastify";
import { OtReadService } from "../../services/ot-read-service";
import { parseAssetQuery } from "./query-parsers";

export async function registerAssetRoutes(app: FastifyInstance, service: OtReadService): Promise<void> {
    app.get("/assets", async (request, reply) => {
        try {
            const query = parseAssetQuery(request.query as Record<string, unknown>);
            return service.queryAssets(query);
        } catch (error) {
            return reply.status(400).send({
                error: (error as Error).message
            });
        }
    });
}
