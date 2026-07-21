# Connecting Pinterest Inspiration MCP to ChatGPT

This guide connects a deployed server to ChatGPT as a custom read-only MCP app.

## Current availability caveat

ChatGPT app and developer-mode availability changes over time. As of July 2026, OpenAI’s published guidance says:

- ChatGPT Business and Enterprise/Edu support custom MCP apps and workspace deployment through developer mode;
- ChatGPT Pro users can connect read/fetch MCPs in developer mode; and
- full MCP capabilities and workspace publishing have additional plan and admin requirements.

The public guidance does not currently list ChatGPT Plus as supporting custom MCP connections. This matters for the product strategy: the repository is a working backend foundation, but a broad consumer launch may require an approved ChatGPT app/plugin listing or another supported distribution path rather than asking every user to add a custom MCP manually.

Always confirm current availability in OpenAI’s official documentation:

- https://help.openai.com/en/articles/12584461-developer-mode-apps-and-full-mcp-connectors-in-chatgpt-beta
- https://help.openai.com/en/articles/11487775-connectors-in-chatgpt

## Before connecting

Confirm:

- the Vercel production deployment is available over HTTPS;
- `GET /api/health` returns HTTP `200`;
- Pinterest’s exact callback URL is registered;
- the Pinterest app has the required access tier and test-user configuration;
- the server’s privacy and terms pages are public; and
- you are using ChatGPT on the web, because custom-app support may not be available on mobile.

Your MCP endpoint is:

```text
https://YOUR-DOMAIN/api/mcp
```

Do not enter the home-page URL or the Pinterest callback URL as the MCP endpoint.

## Business workspace setup

OpenAI’s current workflow is generally:

1. Sign in to ChatGPT on the web as a workspace admin or owner.
2. Open **Workspace Settings**.
3. Enable developer mode or custom-app creation under the workspace’s app / connected-data permissions.
4. Go to **Apps → Create**.
5. Enter a name such as `Pinterest Inspiration`.
6. Enter the remote MCP endpoint:

```text
https://YOUR-DOMAIN/api/mcp
```

7. Start **Scan Tools**.
8. Complete the authorization prompt.
9. Sign in to Pinterest on Pinterest’s own authorization page.
10. Approve the requested board and Pin read scopes.
11. Return to ChatGPT and allow tool scanning to finish.
12. Create the app as a draft.
13. Test it in a chat before publishing it to the workspace.

Menu names can change while the feature is in beta. Use the official OpenAI documentation if the UI differs.

## Pro developer-mode setup

Where read/fetch custom MCP is available for Pro:

1. Open ChatGPT settings on the web.
2. Open **Apps** and enable **Developer mode** under advanced settings.
3. Choose **Create app** or the equivalent custom-app option.
4. Enter the deployed `/api/mcp` endpoint.
5. Scan tools and complete Pinterest OAuth.
6. Enable the app in a chat and test the prompts below.

## What should happen during OAuth

The server supports the discovery and authorization flow expected by a remote MCP client:

1. ChatGPT reads protected-resource metadata.
2. ChatGPT discovers the authorization-server metadata.
3. ChatGPT dynamically registers an OAuth client.
4. ChatGPT opens `/authorize` with PKCE.
5. The server redirects the user to Pinterest OAuth.
6. Pinterest returns an authorization code to the server.
7. The server exchanges it for Pinterest tokens and encrypts them in Redis.
8. The server returns an MCP authorization code to ChatGPT.
9. ChatGPT exchanges that code for MCP access and refresh tokens.
10. Tool calls carry an MCP bearer token linked to the correct encrypted Pinterest connection.

At no point should a user paste a Pinterest password, session cookie, app secret, or access token into ChatGPT.

## Expected tools

Tool scanning should discover:

```text
list_pinterest_boards
get_pinterest_board
list_board_pins
get_pin_details
get_board_inspiration_images
search_saved_pin_metadata
```

The app intentionally exposes no Pinterest write tools.

## Test prompts

Start with:

```text
List my Pinterest boards and show each board’s name, description, privacy, and Pin count.
```

Then:

```text
Open my board called “Editorial Jewellery” and show the first 20 Pins.
```

Then test visual retrieval:

```text
Load six inspiration images from that board. Analyze the recurring composition, color palette, typography, lighting, subject styling, and layout. Do not copy any single Pin.
```

Finally test the intended product use case:

```text
Using the visual patterns from that board, create a five-slide Instagram carousel concept for a jewellery brand. Give me the hook, slide-by-slide copy, visual direction, caption, and image prompts. Keep it original rather than recreating the Pins.
```

Metadata search example:

```text
Search my saved Pin metadata for “minimal skincare packaging” and load the strongest matching board for visual analysis.
```

## Good product prompting behavior

The model should:

- ask which board to use when the user has not selected one;
- load a limited, representative group of images rather than every Pin;
- describe recurring patterns across references;
- distinguish inspiration from direct reproduction;
- generate original output informed by multiple references;
- cite board and Pin identifiers internally when useful for traceability; and
- avoid claiming Pinterest’s metadata search is a global visual-search feature.

## Troubleshooting

### ChatGPT cannot discover the server

Check these URLs in a browser:

```text
https://YOUR-DOMAIN/.well-known/oauth-protected-resource
https://YOUR-DOMAIN/.well-known/oauth-authorization-server
https://YOUR-DOMAIN/api/health
```

All should use the same canonical domain. The MCP endpoint itself requires authorization and may not display a friendly browser page.

### Tool scan reaches OAuth but Pinterest rejects the callback

Confirm Pinterest has exactly:

```text
https://YOUR-DOMAIN/oauth/pinterest/callback
```

Also confirm `APP_URL=https://YOUR-DOMAIN` and redeploy after changing it.

### Pinterest authorizes but ChatGPT reports an OAuth error

Verify Redis is reachable and `TOKEN_ENCRYPTION_KEY` decodes to exactly 32 bytes. Inspect Vercel function logs without printing secrets or full tokens.

### The app connects but no boards appear

Check that:

- the connected Pinterest account owns or can access the expected boards;
- the Pinterest app has the correct access tier;
- the token contains `boards:read` and `pins:read`; and
- secret boards are not expected unless secret scopes are enabled and approved.

### Images fail while metadata works

Some Pinterest media URLs may expire, reject retrieval, or return unsupported content types. Retry with another board or Pin and inspect the safe error text returned by the tool.

### Users on Plus cannot add the app

That is currently a platform-distribution limitation rather than a server bug. Test with a supported plan or workspace. For a consumer launch, investigate publishing through OpenAI’s app/plugin distribution process when eligible.

## Publishing for a workspace

Before a Business or Enterprise/Edu admin publishes the app:

- test every tool with multiple Pinterest accounts;
- confirm there are no write tools;
- review the tool descriptions and returned data;
- verify privacy, terms, deletion, and support processes;
- confirm newly changed tools are rescanned and approved; and
- document who in the workspace can access the app.

## Public distribution roadmap

This repository supplies the remote MCP, OAuth, Pinterest integration, and landing/legal pages. A broad public launch may additionally require:

1. a stable product name and custom domain;
2. Pinterest Standard access;
3. an approved privacy policy and support process;
4. OpenAI app/plugin submission or another supported public distribution mechanism;
5. onboarding UI and account/deletion controls beyond the current OAuth bridge;
6. rate limits, abuse prevention, analytics, and customer support; and
7. production security and legal review.
