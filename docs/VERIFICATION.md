# Verification Checklist

Use this checklist before calling the connector production-ready.

Verification is split into three layers:

1. source and build checks that require no live credentials;
2. deployed infrastructure checks that require Vercel and Redis configuration; and
3. live OAuth and Pinterest retrieval checks that require a real Pinterest app and consenting account.

A passing build alone does not prove that Pinterest OAuth, access-tier permissions, or ChatGPT’s current custom-app flow work for the deployed domain.

## A. Source verification

Run from the repository root:

```bash
npm install
npm run typecheck
npm run build
```

Expected result:

- TypeScript exits successfully;
- Next.js creates a production build;
- the App Router includes `/`, `/privacy`, `/terms`, `/api/health`, `/api/mcp`, OAuth routes, and well-known metadata routes; and
- no environment secret is printed during the build.

GitHub Actions runs type checking and the production build on pushes and pull requests.

### Source review checklist

- [ ] `.env`, `.env.local`, and token files are excluded by `.gitignore`.
- [ ] No Pinterest app secret, access token, refresh token, Redis token, or encryption key appears in Git history.
- [ ] Pinterest OAuth requests contain only approved read scopes.
- [ ] MCP tools are annotated read-only and expose no Pinterest mutation.
- [ ] Pinterest tokens are encrypted before Redis storage.
- [ ] OAuth state is single-use and short-lived.
- [ ] MCP authorization codes are short-lived and PKCE-protected.
- [ ] Production redirect URIs require HTTPS.
- [ ] Image retrieval limits and response-size limits are acceptable for Vercel and the MCP client.

## B. Deployment verification

After deploying, define:

```bash
export APP_URL="https://YOUR-DOMAIN"
```

### 1. Home and legal pages

```bash
curl -I "$APP_URL/"
curl -I "$APP_URL/privacy"
curl -I "$APP_URL/terms"
```

Expected: HTTP `200`.

Manually confirm:

- no placeholder legal entity remains;
- no `your-domain.com` support email remains;
- product copy says read-only;
- privacy and terms links work; and
- the MCP endpoint shown on the landing page uses the correct domain.

### 2. Health endpoint

```bash
curl -sS "$APP_URL/api/health"
```

Expected: HTTP `200` and:

```json
{
  "ok": true,
  "checks": {
    "public_url": true,
    "pinterest_oauth": true,
    "token_encryption": true,
    "redis_credentials": true,
    "redis_reachable": true
  }
}
```

If the endpoint returns `503`, fix every false check before continuing.

### 3. OAuth authorization-server metadata

```bash
curl -sS "$APP_URL/.well-known/oauth-authorization-server"
```

Confirm:

- `issuer` is the canonical `APP_URL`;
- authorization endpoint ends in `/authorize`;
- token endpoint ends in `/token`;
- registration endpoint ends in `/register`;
- PKCE method includes `S256`;
- response type includes `code`; and
- grant types include authorization code and refresh token.

### 4. MCP protected-resource metadata

```bash
curl -sS "$APP_URL/.well-known/oauth-protected-resource"
```

Confirm:

- the resource points to the canonical service;
- the authorization server points to `APP_URL`; and
- supported scopes include `pinterest.read`.

### 5. Unauthenticated MCP request

```bash
curl -i "$APP_URL/api/mcp"
```

Expected: an authorization-related response rather than an unprotected tool list. Check that the response includes the protected-resource metadata reference expected by the MCP authorization flow.

### 6. Dynamic client registration

Use a temporary HTTPS callback or localhost callback only for controlled testing:

```bash
curl -sS -X POST "$APP_URL/register" \
  -H 'content-type: application/json' \
  -d '{
    "client_name": "verification-client",
    "redirect_uris": ["http://localhost:7777/callback"],
    "token_endpoint_auth_method": "none"
  }'
```

Expected:

- HTTP `201`;
- a generated `client_id`;
- the same redirect URI;
- authorization-code and refresh-token grants; and
- no client secret when auth method is `none`.

Do not publish returned client credentials in tickets or logs.

## C. Pinterest configuration verification

In the Pinterest developer app, confirm:

- [ ] the account is a Pinterest business account;
- [ ] the app is approved for the intended access tier;
- [ ] the production callback is exactly `${APP_URL}/oauth/pinterest/callback`;
- [ ] the permitted test account is configured where required;
- [ ] `boards:read` and `pins:read` are available;
- [ ] secret scopes are disabled unless needed and approved;
- [ ] the public privacy URL is current; and
- [ ] the app description matches the deployed behavior.

## D. ChatGPT OAuth and tool verification

Create the custom app with:

```text
https://YOUR-DOMAIN/api/mcp
```

During connection, verify:

- [ ] ChatGPT discovers OAuth metadata automatically.
- [ ] Dynamic client registration succeeds.
- [ ] The authorization request uses PKCE.
- [ ] The browser redirects to Pinterest’s official authorization page.
- [ ] The consent screen contains only expected read scopes.
- [ ] The callback returns to ChatGPT successfully.
- [ ] Tool scanning discovers all six expected tools.
- [ ] No write or destructive Pinterest tool appears.

Expected tools:

```text
list_pinterest_boards
get_pinterest_board
list_board_pins
get_pin_details
get_board_inspiration_images
search_saved_pin_metadata
```

## E. Functional Pinterest tests

Use a test Pinterest account with:

- at least two public boards;
- several image Pins;
- titles and descriptions useful for metadata matching; and
- an optional secret board only when secret scopes are being tested.

### Test 1: board listing

Prompt:

```text
List my Pinterest boards with IDs, names, privacy, descriptions, and Pin counts.
```

Pass criteria:

- expected boards appear;
- IDs are present for follow-up calls;
- pagination bookmark appears when applicable; and
- unauthorized secret boards do not appear.

### Test 2: board metadata

Prompt:

```text
Get the details for board ID BOARD_ID.
```

Pass criteria: returned metadata matches Pinterest.

### Test 3: Pin listing

Prompt:

```text
List the first 20 Pins from board ID BOARD_ID.
```

Pass criteria:

- Pin IDs and metadata appear;
- image URLs are present when Pinterest returns them;
- pagination is represented correctly; and
- no mutation occurs.

### Test 4: individual Pin

Prompt:

```text
Get full details for Pin ID PIN_ID.
```

Pass criteria: metadata matches the selected Pin.

### Test 5: visual retrieval

Prompt:

```text
Load six inspiration images from board ID BOARD_ID and analyze recurring visual patterns.
```

Pass criteria:

- actual images appear in the conversation;
- failed images produce safe per-image errors rather than failing the entire call;
- no more than the requested maximum is loaded; and
- the model analyzes multiple references rather than copying one image.

### Test 6: metadata search

Prompt:

```text
Search my saved Pin metadata for “QUERY”.
```

Pass criteria:

- matching title, description, alt-text, or link terms are returned;
- the response states that search is limited and metadata-based; and
- selected-board and result limits are respected.

## F. Token refresh verification

Pinterest access tokens normally expire before long-lived user authorization should end. Test refresh handling in a controlled environment by using a token close to expiry or temporarily adjusting the refresh margin in a test branch.

Pass criteria:

- the connector uses the encrypted refresh token server-side;
- Redis is updated with newly encrypted access and refresh tokens;
- no raw token appears in logs or responses; and
- the original MCP connection continues working.

Do not manipulate production token expirations casually.

## G. Revocation and failure tests

### Pinterest revocation

1. Revoke the app in Pinterest settings.
2. Call `list_pinterest_boards` again.

Expected: a safe authentication error instructing the user to reconnect. No stale content should be returned from a permanent local cache.

### Expired MCP access token

Use an expired or invalid MCP bearer token.

Expected: unauthorized response without Pinterest data.

### Invalid OAuth state

Open the Pinterest callback with a fake or expired state.

Expected: HTTP `400` with an invalid/expired state error.

### Redirect URI attack

Attempt dynamic registration with a non-HTTPS external redirect URI.

Expected: rejected. Only HTTPS, localhost, and `127.0.0.1` development redirects should pass.

### Missing environment values

Remove one required variable in a preview environment.

Expected:

- `/api/health` returns `503`;
- the landing page shows setup required; and
- no secret value is exposed.

## H. Product-quality tests

- [ ] Test with boards containing 0, 1, 8, 50, and more than 100 Pins.
- [ ] Test board and Pin titles containing emoji and non-Latin characters.
- [ ] Test broken and unsupported image media.
- [ ] Test repeated calls and pagination bookmarks.
- [ ] Test multiple Pinterest users concurrently and confirm isolation.
- [ ] Test reconnecting the same person as a new connection.
- [ ] Test Vercel cold starts and tool latency.
- [ ] Test mobile-width landing and legal pages, even though custom MCP use may be web-only.
- [ ] Confirm logs do not contain bearer tokens, OAuth codes, Pinterest tokens, or app secrets.
- [ ] Confirm infrastructure rate limits and cost alerts are appropriate.

## I. Launch sign-off

Do not mark the launch complete until all applicable items are checked:

- [ ] GitHub Actions is green on the release commit.
- [ ] Vercel production deployment is healthy.
- [ ] Pinterest OAuth succeeds with a real permitted account.
- [ ] All six MCP tools work from ChatGPT.
- [ ] Real images load into the conversation.
- [ ] Token refresh behavior is validated.
- [ ] Revocation fails safely.
- [ ] Privacy, terms, support, and deletion processes are real and operational.
- [ ] Pinterest Standard access is approved for multi-user production use.
- [ ] The intended ChatGPT distribution path supports the target users’ plans.
- [ ] Security and legal reviewers approve the production configuration.
