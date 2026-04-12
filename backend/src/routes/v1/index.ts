import { FastifyInstance } from "fastify";
import { registerAssetRoutes } from "./assets-routes";
import { registerCompanyRoutes } from "./companies-routes";
import { registerOtRoutes } from "./ots-routes";
import { OtReadService } from "../../services/ot-read-service";
import { LocalJsonOtRepository } from "../../repositories/local-json-ot-repository";

export async function registerV1Routes(app: FastifyInstance): Promise<void> {
    const repository = new LocalJsonOtRepository();
    const service = new OtReadService(repository);

    await app.register(async (v1) => {
        await registerOtRoutes(v1, service);
        await registerCompanyRoutes(v1, service);
        await registerAssetRoutes(v1, service);
    }, { prefix: "/api/v1" });
}
