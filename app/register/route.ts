import { NextResponse } from "next/server";
import { isAllowedRedirectUri, registerClient } from "@/lib/oauth";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  let body: {
    client_name?: string;
    redirect_uris?: unknown;
    token_endpoint_auth_method?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_client_metadata" }, { status: 400 });
  }

  if (
    !Array.isArray(body.redirect_uris) ||
    body.redirect_uris.length < 1 ||
    !body.redirect_uris.every(
      (uri) => typeof uri === "string" && isAllowedRedirectUri(uri),
    )
  ) {
    return NextResponse.json(
      {
        error: "invalid_redirect_uri",
        error_description: "Provide at least one valid HTTPS or localhost redirect URI.",
      },
      { status: 400 },
    );
  }

  const method = body.token_endpoint_auth_method ?? "none";
  if (!["none", "client_secret_post", "client_secret_basic"].includes(method)) {
    return NextResponse.json({ error: "invalid_client_metadata" }, { status: 400 });
  }

  const client = await registerClient({
    clientName: body.client_name,
    redirectUris: body.redirect_uris as string[],
    tokenEndpointAuthMethod: method as
      | "none"
      | "client_secret_post"
      | "client_secret_basic",
  });

  return NextResponse.json(
    {
      client_id: client.clientId,
      ...(client.clientSecret
        ? {
            client_secret: client.clientSecret,
            client_secret_expires_at: 0,
          }
        : {}),
      client_id_issued_at: Math.floor(client.createdAt / 1000),
      client_name: client.clientName,
      redirect_uris: client.redirectUris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: client.tokenEndpointAuthMethod,
    },
    {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
