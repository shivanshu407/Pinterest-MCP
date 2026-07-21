import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { getMcpResourceUrl } from "@/lib/env";
import { getJson } from "@/lib/store";
import type { McpTokenRecord } from "@/lib/types";

export function accessTokenKey(token: string): string {
  return `oauth:access:${token}`;
}

export async function verifyMcpToken(
  _request: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined;
  const record = await getJson<McpTokenRecord>(accessTokenKey(bearerToken));
  if (!record || record.expiresAt <= Date.now()) return undefined;
  if (record.resource !== getMcpResourceUrl()) return undefined;

  return {
    token: bearerToken,
    clientId: record.clientId,
    scopes: record.scope.split(/\s+/).filter(Boolean),
    expiresAt: Math.floor(record.expiresAt / 1000),
    resource: new URL(record.resource),
    extra: { connectionId: record.connectionId },
  };
}
