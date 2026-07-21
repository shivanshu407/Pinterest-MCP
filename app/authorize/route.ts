import { NextResponse } from "next/server";
import { randomToken } from "@/lib/crypto";
import {
  getMcpResourceUrl,
  getPinterestRedirectUri,
  getPinterestScopes,
  requiredEnv,
} from "@/lib/env";
import { getClient } from "@/lib/oauth";
import { putJson } from "@/lib/store";
import type { PendingAuthorization } from "@/lib/types";

export const runtime = "nodejs";

function oauthError(
  redirectUri: string | undefined,
  error: string,
  description: string,
  state?: string,
): Response {
  if (!redirectUri) {
    return NextResponse.json(
      { error, error_description: description },
      { status: 400 },
    );
  }
  const redirect = new URL(redirectUri);
  redirect.searchParams.set("error", error);
  redirect.searchParams.set("error_description", description);
  if (state) redirect.searchParams.set("state", state);
  return NextResponse.redirect(redirect);
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const clientId = url.searchParams.get("client_id") ?? "";
  const redirectUri = url.searchParams.get("redirect_uri") ?? undefined;
  const state = url.searchParams.get("state") ?? undefined;
  const responseType = url.searchParams.get("response_type");
  const codeChallenge = url.searchParams.get("code_challenge") ?? "";
  const codeChallengeMethod = url.searchParams.get("code_challenge_method");
  const resource = url.searchParams.get("resource") ?? getMcpResourceUrl();
  const scope = url.searchParams.get("scope") ?? "pinterest.read";

  const client = await getClient(clientId);
  if (!client) return oauthError(undefined, "invalid_client", "Unknown client ID.");
  if (!redirectUri || !client.redirectUris.includes(redirectUri)) {
    return oauthError(undefined, "invalid_request", "Redirect URI is not registered.");
  }
  if (responseType !== "code") {
    return oauthError(redirectUri, "unsupported_response_type", "Only code is supported.", state);
  }
  if (!codeChallenge || codeChallengeMethod !== "S256") {
    return oauthError(redirectUri, "invalid_request", "PKCE with S256 is required.", state);
  }
  if (resource !== getMcpResourceUrl()) {
    return oauthError(redirectUri, "invalid_target", "Unexpected MCP resource.", state);
  }
  if (!scope.split(/\s+/).includes("pinterest.read")) {
    return oauthError(redirectUri, "invalid_scope", "pinterest.read is required.", state);
  }

  const pinterestState = randomToken("pin_state", 32);
  const pending: PendingAuthorization = {
    clientId,
    redirectUri,
    clientState: state,
    codeChallenge,
    codeChallengeMethod: "S256",
    resource,
    requestedScope: "pinterest.read",
    createdAt: Date.now(),
  };
  await putJson(`oauth:pinterest-state:${pinterestState}`, pending, 10 * 60);

  const pinterestAuthorize = new URL("https://www.pinterest.com/oauth/");
  pinterestAuthorize.searchParams.set("client_id", requiredEnv("PINTEREST_APP_ID"));
  pinterestAuthorize.searchParams.set("redirect_uri", getPinterestRedirectUri());
  pinterestAuthorize.searchParams.set("response_type", "code");
  pinterestAuthorize.searchParams.set("scope", getPinterestScopes().join(","));
  pinterestAuthorize.searchParams.set("state", pinterestState);
  return NextResponse.redirect(pinterestAuthorize);
}
