import cors from "@fastify/cors";
import Fastify, { FastifyInstance } from "fastify";
import { registerV1Routes } from "./routes/v1";

export async function buildApp(): Promise<FastifyInstance> {
    const app = Fastify({
        logger: true
    });

    await app.register(cors, {
        origin: true
    });

    app.get("/health", async () => {
        return {
            status: "ok",
            service: "parks-ot-assistant-backend"
        };
    });

    await registerV1Routes(app);
    return app;
}
