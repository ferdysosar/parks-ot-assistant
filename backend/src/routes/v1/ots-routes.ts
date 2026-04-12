import { FastifyInstance } from "fastify";
import { OtReadService } from "../../services/ot-read-service";
import { parseOtCountQuery, parseOtQuery } from "./query-parsers";

export async function registerOtRoutes(app: FastifyInstance, service: OtReadService): Promise<void> {
    app.get("/ots", async (request, reply) => {
        try {
            const query = parseOtQuery(request.query as Record<string, unknown>);
            return service.queryOts(query);
        } catch (error) {
            return reply.status(400).send({
                error: (error as Error).message
            });
        }
    });

    app.get("/ots/count", async (request, reply) => {
        try {
            const query = parseOtCountQuery(request.query as Record<string, unknown>);
            return service.countOts(query);
        } catch (error) {
            return reply.status(400).send({
                error: (error as Error).message
            });
        }
    });
}
