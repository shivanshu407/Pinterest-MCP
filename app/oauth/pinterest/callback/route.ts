import { NextResponse } from "next/server";
import { randomToken } from "@/lib/crypto";
import { exchangePinterestCode, savePinterestConnection } from "@/lib/pinterest";
import { putJson, takeJson } from "@/lib/store";
import type { AuthorizationCode, PendingAuthorization } from "@/lib/types";

export const runtime = "nodejs";

function redirectWithError(
  pending: PendingAuthorization,
  error: string,
  description: string,
): Response {
  const redirect = new URL(pending.redirectUri);
  redirect.searchParams.set("error", error);
  redirect.searchParams.set("error_description", description);
  if (pending.clientState) redirect.searchParams.set("state", pending.clientState);
  return NextResponse.redirect(redirect);
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const state = url.searchParams.get("state") ?? "";
  const pending = await takeJson<PendingAuthorization>(
    `oauth:pinterest-state:${state}`,
  );

  if (!pending) {
    return NextResponse.json(
      { error: "invalid_request", error_description: "OAuth state expired or is invalid." },
      { status: 400 },
    );
  }

  const pinterestError = url.searchParams.get("error");
  if (pinterestError) {
    return redirectWithError(
      pending,
      "access_denied",
      url.searchParams.get("error_description") ?? "Pinterest access was not granted.",
    );
  }

  const code = url.searchParams.get("code");
  if (!code) return redirectWithError(pending, "invalid_request", "Pinterest returned no code.");

  try {
    const pinterestToken = await exchangePinterestCode(code);
    const connectionId = randomToken("pin_connection", 24);
    await savePinterestConnection(connectionId, pinterestToken);

    const authorizationCodeValue = randomToken("mcp_code", 32);
    const authorizationCode: AuthorizationCode = {
      clientId: pending.clientId,
      redirectUri: pending.redirectUri,
      codeChallenge: pending.codeChallenge,
      resource: pending.resource,
      connectionId,
      scope: pending.requestedScope,
      expiresAt: Date.now() + 10 * 60 * 1000,
    };
    await putJson(
      `oauth:code:${authorizationCodeValue}`,
      authorizationCode,
      10 * 60,
    );

    const redirect = new URL(pending.redirectUri);
    redirect.searchParams.set("code", authorizationCodeValue);
    if (pending.clientState) redirect.searchParams.set("state", pending.clientState);
    return NextResponse.redirect(redirect);
  } catch (error) {
    return redirectWithError(
      pending,
      "server_error",
      error instanceof Error ? error.message : "Pinterest authorization failed.",
    );
  }
}
