import { constantTimeEqual, randomToken, sha256Base64Url } from "@/lib/crypto";
import { getJson, putJson } from "@/lib/store";
import type { RegisteredClient } from "@/lib/types";

const CLIENT_TTL_SECONDS = 365 * 24 * 60 * 60;

export function clientKey(clientId: string): string {
  return `oauth:client:${clientId}`;
}

export function isAllowedRedirectUri(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return true;
    return (
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

export async function registerClient(input: {
  clientName?: string;
  redirectUris: string[];
  tokenEndpointAuthMethod?: RegisteredClient["tokenEndpointAuthMethod"];
}): Promise<RegisteredClient> {
  const authMethod = input.tokenEndpointAuthMethod ?? "none";
  const clientId = randomToken("mcp_client", 24);
  const clientSecret = authMethod === "none" ? undefined : randomToken("mcp_secret", 32);

  const client: RegisteredClient = {
    clientId,
    clientSecret,
    clientName: input.clientName?.slice(0, 120) || "MCP Client",
    redirectUris: input.redirectUris,
    tokenEndpointAuthMethod: authMethod,
    createdAt: Date.now(),
  };

  await putJson(clientKey(clientId), client, CLIENT_TTL_SECONDS);
  return client;
}

export async function getClient(clientId: string): Promise<RegisteredClient | null> {
  return getJson<RegisteredClient>(clientKey(clientId));
}

export function verifyPkce(verifier: string, challenge: string): boolean {
  return constantTimeEqual(sha256Base64Url(verifier), challenge);
}

export function parseBasicCredentials(header: string | null): {
  clientId?: string;
  clientSecret?: string;
} {
  if (!header?.startsWith("Basic ")) return {};
  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator < 0) return {};
    return {
      clientId: decoded.slice(0, separator),
      clientSecret: decoded.slice(separator + 1),
    };
  } catch {
    return {};
  }
}

export function validateClientSecret(
  client: RegisteredClient,
  suppliedSecret?: string,
): boolean {
  if (client.tokenEndpointAuthMethod === "none") return true;
  if (!client.clientSecret || !suppliedSecret) return false;
  return constantTimeEqual(client.clientSecret, suppliedSecret);
}
