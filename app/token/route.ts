import { NextResponse } from "next/server";
import { randomToken } from "@/lib/crypto";
import { getMcpResourceUrl } from "@/lib/env";
import {
  getClient,
  parseBasicCredentials,
  validateClientSecret,
  verifyPkce,
} from "@/lib/oauth";
import { accessTokenKey } from "@/lib/mcp-auth";
import { putJson, takeJson } from "@/lib/store";
import type {
  AuthorizationCode,
  McpRefreshTokenRecord,
  McpTokenRecord,
} from "@/lib/types";

export const runtime = "nodejs";

const ACCESS_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 180 * 24 * 60 * 60;

function tokenError(error: string, description: string, status = 400): Response {
  return NextResponse.json(
    { error, error_description: description },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    },
  );
}

async function authenticateClient(
  request: Request,
  form: URLSearchParams,
): Promise<{ clientId: string } | Response> {
  const basic = parseBasicCredentials(request.headers.get("authorization"));
  const clientId = basic.clientId ?? form.get("client_id") ?? "";
  const clientSecret = basic.clientSecret ?? form.get("client_secret") ?? undefined;
  const client = await getClient(clientId);
  if (!client || !validateClientSecret(client, clientSecret)) {
    return tokenError("invalid_client", "Client authentication failed.", 401);
  }
  return { clientId };
}

async function issueTokens(record: McpTokenRecord): Promise<Response> {
  const accessToken = randomToken("mcp_access", 32);
  const refreshToken = randomToken("mcp_refresh", 32);
  const now = Date.now();

  const accessRecord: McpTokenRecord = {
    ...record,
    expiresAt: now + ACCESS_TOKEN_TTL_SECONDS * 1000,
  };
  const refreshRecord: McpRefreshTokenRecord = {
    ...record,
    expiresAt: now + REFRESH_TOKEN_TTL_SECONDS * 1000,
    createdAt: now,
  };

  await Promise.all([
    putJson(accessTokenKey(accessToken), accessRecord, ACCESS_TOKEN_TTL_SECONDS),
    putJson(
      `oauth:refresh:${refreshToken}`,
      refreshRecord,
      REFRESH_TOKEN_TTL_SECONDS,
    ),
  ]);

  return NextResponse.json(
    {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: ACCESS_TOKEN_TTL_SECONDS,
      refresh_token: refreshToken,
      scope: record.scope,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    },
  );
}

export async function POST(request: Request): Promise<Response> {
  let form: URLSearchParams;
  try {
    form = new URLSearchParams(await request.text());
  } catch {
    return tokenError("invalid_request", "Could not parse token request.");
  }

  const authenticated = await authenticateClient(request, form);
  if (authenticated instanceof Response) return authenticated;
  const { clientId } = authenticated;
  const grantType = form.get("grant_type");

  if (grantType === "authorization_code") {
    const codeValue = form.get("code") ?? "";
    const authorizationCode = await takeJson<AuthorizationCode>(
      `oauth:code:${codeValue}`,
    );
    if (!authorizationCode || authorizationCode.expiresAt <= Date.now()) {
      return tokenError("invalid_grant", "Authorization code is invalid or expired.");
    }
    if (authorizationCode.clientId !== clientId) {
      return tokenError("invalid_grant", "Authorization code belongs to another client.");
    }
    if (form.get("redirect_uri") !== authorizationCode.redirectUri) {
      return tokenError("invalid_grant", "Redirect URI does not match.");
    }
    const verifier = form.get("code_verifier") ?? "";
    if (!verifier || !verifyPkce(verifier, authorizationCode.codeChallenge)) {
      return tokenError("invalid_grant", "PKCE verification failed.");
    }
    const resource = form.get("resource") ?? authorizationCode.resource;
    if (resource !== authorizationCode.resource || resource !== getMcpResourceUrl()) {
      return tokenError("invalid_target", "Unexpected MCP resource.");
    }

    return issueTokens({
      clientId,
      connectionId: authorizationCode.connectionId,
      resource,
      scope: authorizationCode.scope,
      expiresAt: 0,
    });
  }

  if (grantType === "refresh_token") {
    const refreshToken = form.get("refresh_token") ?? "";
    const record = await takeJson<McpRefreshTokenRecord>(
      `oauth:refresh:${refreshToken}`,
    );
    if (!record || record.expiresAt <= Date.now() || record.clientId !== clientId) {
      return tokenError("invalid_grant", "Refresh token is invalid or expired.");
    }
    const resource = form.get("resource") ?? record.resource;
    if (resource !== record.resource || resource !== getMcpResourceUrl()) {
      return tokenError("invalid_target", "Unexpected MCP resource.");
    }
    return issueTokens({ ...record, resource, expiresAt: 0 });
  }

  return tokenError("unsupported_grant_type", "Use authorization_code or refresh_token.");
}
