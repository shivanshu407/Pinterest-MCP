import { NextResponse } from "next/server";
import { getBaseUrl, getMcpResourceUrl, getPinterestRedirectUri } from "@/lib/env";
import { getRedis } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function configured(value: string | undefined): boolean {
  return Boolean(value && value.trim());
}

function validEncryptionKey(value: string | undefined): boolean {
  if (!value) return false;
  try {
    return Buffer.from(value, "base64").length === 32;
  } catch {
    return false;
  }
}

export async function GET(): Promise<Response> {
  const pinterest =
    configured(process.env.PINTEREST_APP_ID) &&
    configured(process.env.PINTEREST_APP_SECRET);
  const encryption = validEncryptionKey(process.env.TOKEN_ENCRYPTION_KEY);
  const redisCredentials =
    configured(process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL) &&
    configured(process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN);
  const publicUrl = configured(
    process.env.APP_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL,
  );

  let redisReachable = false;
  if (redisCredentials) {
    try {
      const pong = await getRedis().ping();
      redisReachable = pong === "PONG" || pong === "pong";
    } catch {
      redisReachable = false;
    }
  }

  const checks = {
    public_url: publicUrl,
    pinterest_oauth: pinterest,
    token_encryption: encryption,
    redis_credentials: redisCredentials,
    redis_reachable: redisReachable,
  };
  const ok = Object.values(checks).every(Boolean);

  return NextResponse.json(
    {
      ok,
      service: "pinterest-inspiration-mcp",
      version: "0.1.0",
      mode: "read-only",
      checks,
      endpoints: {
        home: getBaseUrl(),
        mcp: getMcpResourceUrl(),
        pinterest_callback: getPinterestRedirectUri(),
        oauth_metadata: `${getBaseUrl()}/.well-known/oauth-authorization-server`,
        protected_resource_metadata: `${getBaseUrl()}/.well-known/oauth-protected-resource`,
      },
      note: ok
        ? "Infrastructure configuration is healthy. Complete a real Pinterest OAuth flow to verify account-level access."
        : "One or more deployment checks failed. No secret values are returned by this endpoint.",
      checked_at: new Date().toISOString(),
    },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
