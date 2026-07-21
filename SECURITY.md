# Security Policy

## Reporting a vulnerability

Do not open a public issue for vulnerabilities involving:

- Pinterest app credentials or OAuth tokens;
- MCP access or refresh tokens;
- authorization-code or PKCE bypasses;
- redirect URI validation;
- cross-user data access;
- Redis exposure;
- encryption-key handling;
- server-side request forgery through Pin media retrieval; or
- any path that could expose private or secret-board content.

Prefer GitHub’s private vulnerability-reporting / Security Advisory feature for this repository. If that is unavailable, contact the monitored security or support address configured for the deployed product. Never include live passwords, full access tokens, refresh tokens, app secrets, Redis tokens, or encryption keys in a report.

Include:

- a clear description of the issue;
- affected endpoint or tool;
- minimal reproducible steps using test credentials;
- expected and actual behavior;
- potential impact;
- suggested remediation when available; and
- whether you believe active exploitation is occurring.

## Supported versions

Until formal releases are published, only the latest commit on the default branch is supported.

## Current security controls

The implementation includes:

- Pinterest OAuth instead of password or cookie collection;
- minimum Pinterest read scopes;
- separate Pinterest connection records per authorized user;
- AES-256-GCM encryption of Pinterest access and refresh tokens before Redis storage;
- MCP authorization-code flow with PKCE;
- short-lived, single-use OAuth state and authorization codes;
- MCP access and refresh token validation;
- HTTPS-only external redirect URIs, with localhost exceptions for development;
- read-only and non-destructive MCP tool annotations;
- limits on board counts, Pins per board, result counts, and images per visual call;
- no intentional permanent storage of downloaded Pin images; and
- `.env` and local secret-file exclusions.

## Production hardening before broad public use

The repository is a strong MVP foundation, not a substitute for a production security program. Before opening the service to untrusted public traffic, add or confirm:

### Abuse and availability

- per-IP, per-user, and per-connection rate limits;
- limits on dynamic client registrations;
- concurrency and bandwidth controls for image downloads;
- bot and abuse detection;
- Redis and Vercel cost alerts;
- request timeouts and circuit breakers; and
- operational alerting for OAuth, Redis, and Pinterest API failures.

### OAuth and identity

- a documented client-registration policy;
- redirect URI restrictions appropriate to the final ChatGPT/OpenAI client behavior;
- review of open-redirect and mix-up attack resistance;
- refresh-token rotation and replay handling validation;
- explicit account disconnect and server-side deletion controls;
- revocation handling; and
- periodic review against the current MCP authorization specification.

### Data protection

- environment-separated encryption keys and databases;
- a key-rotation strategy with migration support;
- least-privilege access to Vercel, Redis, Pinterest, and GitHub;
- audit logging that excludes tokens and sensitive content;
- documented retention and deletion jobs;
- data-processing agreements and region choices appropriate to customers; and
- incident response and breach-notification procedures.

### Pin image retrieval

Pin media retrieval is an open-world network action. Before public scale, validate defenses against:

- redirects to unexpected hosts or protocols;
- private-network and link-local IP destinations;
- DNS rebinding;
- oversized responses and decompression bombs;
- unsupported or misleading MIME types;
- excessive redirect chains;
- slow responses; and
- URLs that change after validation.

Use strict allowlisting or a hardened outbound-fetch service if Pinterest’s media-host patterns permit it.

### Application and supply chain

- dependency updates and vulnerability monitoring;
- lockfile-based reproducible installs;
- branch protection and required CI;
- secret scanning and push protection;
- code-owner review for authentication and crypto changes;
- dependency provenance where available;
- SAST, DAST, and targeted penetration testing; and
- a documented release and rollback process.

## Secret handling

Never commit or expose:

```text
PINTEREST_APP_SECRET
UPSTASH_REDIS_REST_TOKEN
KV_REST_API_TOKEN
TOKEN_ENCRYPTION_KEY
Pinterest access tokens
Pinterest refresh tokens
MCP access tokens
MCP refresh tokens
OAuth authorization codes
```

If a Pinterest app secret is exposed, rotate it in Pinterest immediately. If the token-encryption key is exposed, treat stored connection records as compromised, rotate the key, invalidate or delete affected records, and require users to reconnect.

## Security-sensitive code areas

Review these files carefully when making changes:

```text
app/authorize/route.ts
app/register/route.ts
app/token/route.ts
app/oauth/pinterest/callback/route.ts
app/api/mcp/route.ts
lib/crypto.ts
lib/mcp-auth.ts
lib/oauth.ts
lib/pinterest.ts
lib/store.ts
```
