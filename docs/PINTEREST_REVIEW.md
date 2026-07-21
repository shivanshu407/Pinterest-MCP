# Pinterest Developer Access Review Preparation

This document provides review-ready language and a video-demo checklist for the Pinterest Inspiration MCP product.

Pinterest’s official access-tier guidance says production products should use Standard access. Upgrading requires an app already approved for Trial access, compliance with Pinterest’s developer rules, a public privacy policy, and a video showing a working OAuth flow and live Pinterest integration.

Official references:

- https://developers.pinterest.com/docs/key-concepts/access-tiers/
- https://developers.pinterest.com/docs/getting-started/connect-app/
- https://developers.pinterest.com/docs/getting-started/set-up-authentication-and-authorization/

## Suggested app name

```text
Pinterest Inspiration for ChatGPT
```

Use the actual final product name consistently across the Pinterest app, website, privacy policy, terms, demo video, and ChatGPT app listing.

## Suggested short description

```text
A read-only creative inspiration connector that lets Pinterest users authorize their own account and ask an AI assistant to analyze selected boards and Pins when creating original social-media concepts, captions, carousels, briefs, and image prompts.
```

## Suggested detailed use-case description

```text
Creators, social-media managers, and brands often save their visual references in Pinterest boards. Today they must manually take screenshots and upload those screenshots to an AI assistant before requesting content.

Our product lets each user authorize their own Pinterest account through Pinterest OAuth. After authorization, the user can ask an MCP-compatible AI assistant to list their boards, retrieve Pin metadata, and load a limited number of Pin images from a board they explicitly select. The assistant analyzes recurring visual characteristics across multiple references—such as composition, palette, typography, lighting, styling, and layout—and uses those characteristics to propose original Instagram concepts, carousels, captions, creative briefs, and image prompts.

The integration is read-only. It requests boards:read and pins:read. It does not publish, edit, move, or delete Pinterest content. Secret-board scopes are disabled by default and would be requested only if separately needed and approved.

Pinterest OAuth tokens are exchanged server-side and encrypted before storage. Users never provide us with their Pinterest password or session cookies. They can revoke access through Pinterest and disconnect the app from their AI client.
```

## Requested scopes

Default production request:

```text
boards:read
pins:read
```

Only request these optional scopes if the reviewed use case truly needs secret boards:

```text
boards:read_secret
pins:read_secret
```

Do not request any write, ads, catalog, billing, or business-access scopes for this product.

## Public URLs to provide

Replace the examples with the final custom domain:

```text
Product home: https://YOUR-DOMAIN/
Privacy policy: https://YOUR-DOMAIN/privacy
Terms: https://YOUR-DOMAIN/terms
OAuth callback: https://YOUR-DOMAIN/oauth/pinterest/callback
Support contact: monitored-address@YOUR-DOMAIN
```

Before submission, ensure:

- all URLs load without authentication;
- the privacy policy names the real operator;
- the support email is monitored;
- there are no `your-domain.com` placeholders;
- the callback exactly matches the Pinterest app configuration; and
- the website clearly states the product is read-only.

## Video demo script

Pinterest’s guidance says the demo must show the authentication flow and live Pinterest integration. Record one continuous video where possible.

### 1. Introduce the product

Show the production landing page and say:

```text
This product lets creators connect their own Pinterest account to an AI assistant and use selected saved boards as visual inspiration. It is read-only and does not publish or modify Pinterest content.
```

Briefly show the privacy policy and terms links.

### 2. Show the disconnected state

Open ChatGPT or the supported MCP client with the app not yet authorized.

Show the configured MCP endpoint without exposing any secret values.

### 3. Start authorization

Click the app connection or tool-scan authorization action.

Show that the flow redirects to Pinterest’s official domain. Do not paste a token or use browser cookies as an alternative authentication method.

### 4. Show Pinterest consent

Show the Pinterest account and the requested read permissions. Explain:

```text
The app requests only permission to read boards and Pins needed for the user-selected inspiration workflow.
```

Approve access using a permitted review or test account.

### 5. Return to the AI client

Show the redirect back to the client and successful connection. Avoid displaying access tokens, refresh tokens, app secrets, Redis credentials, authorization codes, or private logs.

### 6. List real boards

Use this prompt:

```text
List my Pinterest boards and show their names, descriptions, privacy, and Pin counts.
```

Show the live result from the connected Pinterest account.

### 7. Retrieve a board’s Pins

Select a visually coherent board and ask:

```text
Open this board and show the first 12 Pins with their titles and descriptions.
```

Show that the app retrieves real Pin metadata.

### 8. Load visual inspiration

Ask:

```text
Load six images from this board and analyze recurring composition, palette, typography, lighting, styling, and layout.
```

Show the actual board images appearing in the AI conversation and the cross-reference analysis.

### 9. Demonstrate the approved product outcome

Ask:

```text
Use the recurring visual patterns—not any single Pin—to create an original five-slide Instagram carousel concept. Include the hook, slide copy, visual direction, caption, and image prompts.
```

Show the original creative output and explain that the user is responsible for reviewing rights and suitability before publishing.

### 10. Show that there are no write tools

Show the available MCP tool list. Point out that it contains only board/Pin reading, metadata search, and image loading. There should be no create, update, move, publish, or delete tool.

### 11. Show revocation

Where practical, show the user disconnecting the app from the AI client or revoking it in Pinterest settings. Then attempt a tool call and show that access no longer works or requires reconnection.

## Review checklist

- [ ] Trial access is approved before requesting Standard access.
- [ ] Final production HTTPS domain is live.
- [ ] Privacy policy is public, accurate, and associated with the product/operator.
- [ ] Terms page is public.
- [ ] Real support email is configured.
- [ ] OAuth callback exactly matches the registered URI.
- [ ] Demo includes Pinterest’s consent screen.
- [ ] Demo includes the complete redirect back to the product.
- [ ] Demo shows a live API retrieval, not a mockup.
- [ ] Demo shows the intended creator workflow.
- [ ] Demo does not reveal tokens or secrets.
- [ ] Requested scopes match the described use case.
- [ ] No write scopes are requested.
- [ ] Product copy does not imply affiliation or endorsement by Pinterest.

## Common avoidable denial risks

- vague description such as “AI Pinterest integration” without explaining the user action and retrieved data;
- inaccessible or placeholder privacy policy;
- demo that skips OAuth or uses an already logged-in result without showing consent;
- wireframes instead of a live integration;
- collecting passwords, cookies, or manually pasted access tokens;
- requesting write or advertising scopes unrelated to the product;
- enabling secret-board scopes without explaining why;
- exposing secrets in the recording; or
- submitting a preview URL that later changes.

## Data-handling summary for reviewers

```text
Pinterest OAuth access and refresh tokens are received server-side and encrypted with AES-256-GCM before storage in managed Redis. Tokens are isolated by an internal connection identifier. Pin images are fetched only when requested and returned to the AI client for the current analysis; this application does not intentionally build a permanent image library. Users can revoke authorization through Pinterest, and stored connection records expire automatically or can be deleted earlier through the support process.
```

Review this statement against the deployed implementation immediately before submission and update it if the architecture changes.
