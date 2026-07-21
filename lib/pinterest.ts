import { decryptSecret, encryptSecret } from "@/lib/crypto";
import {
  getPinterestRedirectUri,
  getPinterestScopes,
  requiredEnv,
} from "@/lib/env";
import { getJson, putJson } from "@/lib/store";
import type {
  PinterestBoard,
  PinterestConnection,
  PinterestImage,
  PinterestPage,
  PinterestPin,
  PinterestTokenResponse,
} from "@/lib/types";

const PINTEREST_API_BASE = "https://api.pinterest.com/v5";
const CONNECTION_TTL_SECONDS = 400 * 24 * 60 * 60;
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000;

function connectionKey(connectionId: string): string {
  return `pinterest:connection:${connectionId}`;
}

function basicAuthorization(): string {
  return `Basic ${Buffer.from(
    `${requiredEnv("PINTEREST_APP_ID")}:${requiredEnv("PINTEREST_APP_SECRET")}`,
  ).toString("base64")}`;
}

async function tokenRequest(body: URLSearchParams): Promise<PinterestTokenResponse> {
  const response = await fetch(`${PINTEREST_API_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: basicAuthorization(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  const payload = (await response.json()) as PinterestTokenResponse & {
    message?: string;
    code?: number;
  };

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.message || `Pinterest token request failed (${response.status}).`);
  }
  return payload;
}

export async function exchangePinterestCode(code: string): Promise<PinterestTokenResponse> {
  return tokenRequest(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getPinterestRedirectUri(),
    }),
  );
}

export async function savePinterestConnection(
  connectionId: string,
  token: PinterestTokenResponse,
): Promise<PinterestConnection> {
  const now = Date.now();
  const existing = await getJson<PinterestConnection>(connectionKey(connectionId));
  const refreshExpiresAt = token.refresh_token_expires_at
    ? token.refresh_token_expires_at * 1000
    : token.refresh_token_expires_in
      ? now + token.refresh_token_expires_in * 1000
      : existing?.refreshTokenExpiresAt;

  const connection: PinterestConnection = {
    connectionId,
    encryptedAccessToken: encryptSecret(token.access_token),
    encryptedRefreshToken: token.refresh_token
      ? encryptSecret(token.refresh_token)
      : existing?.encryptedRefreshToken,
    accessTokenExpiresAt: now + token.expires_in * 1000,
    refreshTokenExpiresAt: refreshExpiresAt,
    pinterestScope: token.scope,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await putJson(connectionKey(connectionId), connection, CONNECTION_TTL_SECONDS);
  return connection;
}

async function refreshPinterestConnection(
  connection: PinterestConnection,
): Promise<PinterestConnection> {
  if (!connection.encryptedRefreshToken) {
    throw new Error("Pinterest authorization expired. Reconnect the Pinterest account.");
  }

  if (
    connection.refreshTokenExpiresAt &&
    connection.refreshTokenExpiresAt <= Date.now()
  ) {
    throw new Error("Pinterest refresh token expired. Reconnect the Pinterest account.");
  }

  const refreshed = await tokenRequest(
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: decryptSecret(connection.encryptedRefreshToken),
      scope: getPinterestScopes().join(","),
    }),
  );
  return savePinterestConnection(connection.connectionId, refreshed);
}

export async function getPinterestAccessToken(connectionId: string): Promise<string> {
  let connection = await getJson<PinterestConnection>(connectionKey(connectionId));
  if (!connection) {
    throw new Error("Pinterest connection was not found. Reconnect the account.");
  }

  if (connection.accessTokenExpiresAt <= Date.now() + TOKEN_REFRESH_MARGIN_MS) {
    connection = await refreshPinterestConnection(connection);
  }

  return decryptSecret(connection.encryptedAccessToken);
}

async function pinterestFetch<T>(
  connectionId: string,
  path: string,
  query?: Record<string, string | number | undefined>,
): Promise<T> {
  const url = new URL(`${PINTEREST_API_BASE}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const call = async (accessToken: string) =>
    fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

  let response = await call(await getPinterestAccessToken(connectionId));
  if (response.status === 401) {
    const connection = await getJson<PinterestConnection>(connectionKey(connectionId));
    if (connection?.encryptedRefreshToken) {
      const refreshed = await refreshPinterestConnection(connection);
      response = await call(decryptSecret(refreshed.encryptedAccessToken));
    }
  }

  const text = await response.text();
  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { message: text };
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message: unknown }).message)
        : `Pinterest API request failed (${response.status}).`;
    throw new Error(message);
  }

  return payload as T;
}

export async function listBoards(
  connectionId: string,
  pageSize = 25,
  bookmark?: string,
  privacy?: "PUBLIC" | "PROTECTED" | "SECRET",
): Promise<PinterestPage<PinterestBoard>> {
  return pinterestFetch(connectionId, "/boards", {
    page_size: Math.min(Math.max(pageSize, 1), 100),
    bookmark,
    privacy,
  });
}

export async function getBoard(
  connectionId: string,
  boardId: string,
): Promise<PinterestBoard> {
  return pinterestFetch(connectionId, `/boards/${encodeURIComponent(boardId)}`);
}

export async function listBoardPins(
  connectionId: string,
  boardId: string,
  pageSize = 25,
  bookmark?: string,
): Promise<PinterestPage<PinterestPin>> {
  return pinterestFetch(
    connectionId,
    `/boards/${encodeURIComponent(boardId)}/pins`,
    {
      page_size: Math.min(Math.max(pageSize, 1), 100),
      bookmark,
    },
  );
}

export async function getPin(
  connectionId: string,
  pinId: string,
): Promise<PinterestPin> {
  return pinterestFetch(connectionId, `/pins/${encodeURIComponent(pinId)}`);
}

export function getBestPinImage(pin: PinterestPin): PinterestImage | null {
  const images = Object.values(pin.media?.images ?? {}).filter(
    (image): image is PinterestImage => Boolean(image?.url),
  );
  if (!images.length) return null;
  return images.sort(
    (left, right) =>
      (right.width ?? 0) * (right.height ?? 0) -
      (left.width ?? 0) * (left.height ?? 0),
  )[0];
}

export function pinSummary(pin: PinterestPin): Record<string, unknown> {
  const image = getBestPinImage(pin);
  return {
    id: pin.id,
    title: pin.title ?? null,
    description: pin.description ?? null,
    alt_text: pin.alt_text ?? null,
    link: pin.link ?? null,
    board_id: pin.board_id ?? null,
    image_url: image?.url ?? null,
    image_width: image?.width ?? null,
    image_height: image?.height ?? null,
  };
}

export async function downloadPinterestImage(url: string): Promise<{
  data: string;
  mimeType: string;
}> {
  const parsed = new URL(url);
  if (!(parsed.hostname === "pinimg.com" || parsed.hostname.endsWith(".pinimg.com"))) {
    throw new Error("Refused to download a non-Pinterest image host.");
  }

  const response = await fetch(parsed, {
    headers: { "User-Agent": "Pinterest-Inspiration-MCP/0.1" },
    cache: "force-cache",
  });
  if (!response.ok) throw new Error(`Could not download Pin image (${response.status}).`);

  const mimeType = response.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
  if (!mimeType.startsWith("image/")) throw new Error("Pin media is not an image.");

  const declaredSize = Number(response.headers.get("content-length") ?? 0);
  if (declaredSize > 8_000_000) throw new Error("Pin image exceeds the 8 MB safety limit.");

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > 8_000_000) throw new Error("Pin image exceeds the 8 MB safety limit.");

  return { data: buffer.toString("base64"), mimeType };
}
