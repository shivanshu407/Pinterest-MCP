# Deploying Pinterest Inspiration MCP to Vercel

This guide deploys the connector as a public HTTPS MCP server with multi-user Pinterest OAuth and encrypted token storage.

## 1. Prepare the accounts

You need:

- a Vercel account connected to GitHub;
- an Upstash account or Vercel Marketplace Redis integration;
- a Pinterest business account;
- a Pinterest developer app approved for at least Trial access; and
- a ChatGPT account or workspace with access to custom MCP apps in developer mode.

For a production product used by multiple creators, plan to request Pinterest Standard access. Pinterest recommends Standard access for production and requires a public privacy policy plus a video showing the real OAuth and integration flow.

## 2. Import the repository into Vercel

1. In Vercel, choose **Add New → Project**.
2. Import `shivanshu407/Pinterest-MCP`.
3. Keep the detected framework as **Next.js**.
4. Keep the root directory as the repository root.
5. Use Node.js 20 or newer.
6. Do not add real secrets to GitHub.

The application does not require a custom `vercel.json`; Vercel detects the Next.js App Router and deploys `/api/mcp` as a serverless route.

## 3. Add Redis

### Option A: Vercel Marketplace

1. Open the Vercel project.
2. Go to **Storage** or **Marketplace**.
3. Add an Upstash Redis integration.
4. Link it to this project and all required environments.

The connector accepts either:

```text
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

or Vercel KV-compatible names:

```text
KV_REST_API_URL
KV_REST_API_TOKEN
```

### Option B: Existing Upstash database

Create a Redis database in Upstash and copy its REST URL and REST token into the Vercel environment variables.

Use a dedicated database for this service in production. Enable appropriate account security, restrict team access, and monitor usage.

## 4. Generate the token-encryption key

Run locally:

```bash
openssl rand -base64 32
```

Save the complete output as:

```text
TOKEN_ENCRYPTION_KEY
```

It must decode to exactly 32 bytes. Losing or rotating this value without a migration makes existing encrypted Pinterest connections unreadable and requires users to reconnect.

## 5. Create the first Vercel deployment

Add temporary or known environment variables except `APP_URL`, then deploy once to obtain the production URL, for example:

```text
https://pinterest-mcp-example.vercel.app
```

Use a stable production domain. Preview deployment URLs are not suitable as the canonical Pinterest callback because they change.

## 6. Configure the Pinterest developer app

In Pinterest Developers:

1. Use a Pinterest business account.
2. Create or open the developer app.
3. Add the exact production redirect URI:

```text
https://YOUR-DOMAIN/oauth/pinterest/callback
```

4. Copy the app ID and app secret.
5. Add them to Vercel as:

```text
PINTEREST_APP_ID
PINTEREST_APP_SECRET
```

6. Keep secret-board access disabled initially:

```text
PINTEREST_INCLUDE_SECRET_SCOPES=false
```

The default app requests only:

```text
boards:read pins:read
```

Enable `PINTEREST_INCLUDE_SECRET_SCOPES=true` only when secret-board access is genuinely required and approved. It adds:

```text
boards:read_secret pins:read_secret
```

Pinterest requires the redirect URI used during token exchange to match the registered URI exactly. Differences in protocol, domain, path, or trailing slash can cause OAuth failure.

## 7. Add all production variables

Set these in Vercel for the Production environment:

```text
APP_URL=https://YOUR-DOMAIN
PINTEREST_APP_ID=...
PINTEREST_APP_SECRET=...
PINTEREST_INCLUDE_SECRET_SCOPES=false
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
TOKEN_ENCRYPTION_KEY=...
LEGAL_ENTITY_NAME=Your legal company or operator name
SUPPORT_EMAIL=monitored-address@your-domain.com
```

Rules:

- `APP_URL` must not end with `/`.
- Never prefix server-side secrets with `NEXT_PUBLIC_`.
- Apply the variables to Production and to Preview only when preview testing is intentional.
- Do not paste secrets into issues, screenshots, prompts, commits, or chat messages.

Redeploy after changing environment variables.

## 8. Optional custom domain

A custom domain is strongly recommended before Pinterest Standard-access review.

1. Add the domain in Vercel.
2. Update `APP_URL` to the final HTTPS domain.
3. Update the Pinterest redirect URI to the same domain.
4. Redeploy.
5. Confirm the privacy and terms pages load on that domain.

Example:

```text
APP_URL=https://pins.yourcompany.com
Pinterest callback=https://pins.yourcompany.com/oauth/pinterest/callback
MCP endpoint=https://pins.yourcompany.com/api/mcp
Privacy=https://pins.yourcompany.com/privacy
Terms=https://pins.yourcompany.com/terms
```

## 9. Verify infrastructure

Open:

```text
https://YOUR-DOMAIN/api/health
```

A ready deployment returns HTTP `200` and:

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

The endpoint never returns secret values.

Also check:

```text
https://YOUR-DOMAIN/.well-known/oauth-authorization-server
https://YOUR-DOMAIN/.well-known/oauth-protected-resource
```

Both should return JSON metadata and reference the same canonical domain.

## 10. Connect the MCP app in ChatGPT

Use:

```text
https://YOUR-DOMAIN/api/mcp
```

Follow [`CHATGPT_SETUP.md`](CHATGPT_SETUP.md). During tool scanning, ChatGPT should discover OAuth metadata, register as a client, open the authorization flow, and redirect the user to Pinterest.

## 11. Complete a real OAuth test

Infrastructure health is not enough. Complete this real flow:

1. Add a permitted test account in Pinterest’s developer settings when required.
2. Start the ChatGPT custom-app connection.
3. Approve the Pinterest permissions.
4. Return to ChatGPT.
5. Ask the app to list boards.
6. Select a board and list its Pins.
7. Load a small group of inspiration images.
8. Disconnect or revoke authorization and verify future calls fail cleanly.

Use the complete checklist in [`VERIFICATION.md`](VERIFICATION.md).

## 12. Prepare Pinterest Standard-access review

Before submitting:

- use a final production domain;
- configure a real legal entity and monitored support address;
- ensure `/privacy` and `/terms` are publicly accessible;
- record the complete OAuth flow;
- show a real Pinterest API retrieval inside the product;
- clearly explain that the product is read-only;
- show the user selecting their own board for creative analysis; and
- avoid using raw session cookies, passwords, or manually pasted tokens.

See [`PINTEREST_REVIEW.md`](PINTEREST_REVIEW.md).

## Troubleshooting

### Pinterest says the redirect URI is invalid

Confirm the registered callback exactly matches:

```text
${APP_URL}/oauth/pinterest/callback
```

Check HTTPS, host, path, and trailing slash.

### Health check says `token_encryption: false`

Generate a new key with:

```bash
openssl rand -base64 32
```

Do not use an arbitrary password.

### Health check says Redis is not reachable

Verify the REST URL and token belong to the same database, are available in the current Vercel environment, and have not been revoked.

### OAuth completes but tool calls later fail

Pinterest access tokens expire. The connector refreshes them using the stored refresh token. If the refresh token has expired or authorization was revoked, reconnect the Pinterest account.

### The landing page still shows setup required

Redeploy after adding environment variables. Confirm variables are attached to the environment serving the current URL.

### Preview URL redirects to production

`APP_URL` intentionally defines the canonical OAuth server. For production testing, use the production domain. For isolated preview testing, create a separate Pinterest app or callback configuration and set preview-specific variables carefully.
