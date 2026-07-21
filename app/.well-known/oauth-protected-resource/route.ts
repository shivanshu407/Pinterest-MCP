import {
  metadataCorsOptionsRequestHandler,
  protectedResourceHandler,
} from "mcp-handler";
import { getBaseUrl, getMcpResourceUrl } from "@/lib/env";

export const runtime = "nodejs";

const handler = protectedResourceHandler({
  authServerUrls: [getBaseUrl()],
  resourceUrl: getMcpResourceUrl(),
});
const corsHandler = metadataCorsOptionsRequestHandler();

export { handler as GET, corsHandler as OPTIONS };
