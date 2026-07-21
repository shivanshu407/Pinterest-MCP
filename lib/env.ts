function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getBaseUrl(): string {
  const explicit = process.env.APP_URL;
  if (explicit) return trimTrailingSlash(explicit);

  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelUrl) return `https://${trimTrailingSlash(vercelUrl)}`;

  return "http://localhost:3000";
}

export function getMcpResourceUrl(): string {
  return `${getBaseUrl()}/api/mcp`;
}

export function getPinterestRedirectUri(): string {
  return `${getBaseUrl()}/oauth/pinterest/callback`;
}

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function getPinterestScopes(): string[] {
  const scopes = ["boards:read", "pins:read"];
  if (process.env.PINTEREST_INCLUDE_SECRET_SCOPES === "true") {
    scopes.push("boards:read_secret", "pins:read_secret");
  }
  return scopes;
}
