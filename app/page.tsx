export const dynamic = "force-dynamic";

const githubUrl = "https://github.com/shivanshu407/Pinterest-MCP";

function isConfigured(value: string | undefined): boolean {
  return Boolean(value && value.trim());
}

function encryptionKeyIsValid(value: string | undefined): boolean {
  if (!value) return false;
  try {
    return Buffer.from(value, "base64").length === 32;
  } catch {
    return false;
  }
}

export default function HomePage() {
  const pinterestReady =
    isConfigured(process.env.PINTEREST_APP_ID) &&
    isConfigured(process.env.PINTEREST_APP_SECRET);
  const redisReady =
    isConfigured(
      process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL,
    ) &&
    isConfigured(
      process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN,
    );
  const encryptionReady = encryptionKeyIsValid(
    process.env.TOKEN_ENCRYPTION_KEY,
  );
  const appUrlReady = isConfigured(
    process.env.APP_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL,
  );

  const checks = [
    {
      name: "Public app URL",
      description: "Used for OAuth callbacks and MCP metadata",
      ready: appUrlReady,
    },
    {
      name: "Pinterest OAuth",
      description: "App ID and app secret configured",
      ready: pinterestReady,
    },
    {
      name: "Encrypted storage",
      description: "Valid 32-byte encryption key configured",
      ready: encryptionReady,
    },
    {
      name: "Redis",
      description: "Upstash or Vercel KV credentials configured",
      ready: redisReady,
    },
  ];

  const ready = checks.every((check) => check.ready);
  const publicUrl =
    process.env.APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://your-project.vercel.app");

  return (
    <main>
      <div className="site-shell">
        <nav className="nav" aria-label="Primary navigation">
          <a className="brand" href="#top" aria-label="Pinterest Inspiration MCP home">
            <span className="brand-mark" aria-hidden="true">P</span>
            <span>Pinterest Inspiration MCP</span>
          </a>
          <div className="nav-links">
            <a href="#how-it-works">How it works</a>
            <a href="#deployment">Deployment</a>
            <a href={githubUrl} target="_blank" rel="noreferrer">GitHub ↗</a>
          </div>
        </nav>

        <section className="hero" id="top">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="eyebrow-dot" /> Read-only Pinterest connection
            </span>
            <h1>Turn saved Pins into better creative output.</h1>
            <p>
              Let creators connect their Pinterest account once. ChatGPT can then
              browse their boards, load real inspiration images, understand their
              visual taste, and produce more relevant Instagram concepts, captions,
              carousels, and image prompts.
            </p>
            <div className="actions">
              <a className="button button-primary" href="#deployment">
                Deploy the connector
              </a>
              <a className="button" href={githubUrl} target="_blank" rel="noreferrer">
                View source on GitHub
              </a>
            </div>
            <div className="trust-row" aria-label="Product assurances">
              <span className="trust-item">No Pin publishing</span>
              <span className="trust-item">Minimum OAuth scopes</span>
              <span className="trust-item">Encrypted tokens</span>
            </div>
          </div>

          <div className="demo-card" aria-label="Example ChatGPT workflow">
            <div className="demo-topbar">
              <div className="window-dots" aria-hidden="true"><span /><span /><span /></div>
              <span className="connection-pill">Pinterest connected</span>
            </div>
            <div className="chat">
              <div className="message message-user">
                Use my “Editorial Jewellery” board and create a five-slide Instagram carousel.
              </div>
              <div className="tool-call">
                get_board_inspiration_images<br />
                board: Editorial Jewellery · images: 6
              </div>
              <div className="message message-ai">
                Your references repeatedly use warm neutrals, hard side-lighting,
                tight product crops, and minimal serif typography. I’ll carry those
                traits into the carousel without copying any single Pin.
                <div className="pin-grid" aria-hidden="true">
                  <span className="pin-tile" />
                  <span className="pin-tile" />
                  <span className="pin-tile" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="how-it-works">
          <div className="section-heading">
            <span className="eyebrow">Creator workflow</span>
            <h2>From scattered screenshots to usable creative context.</h2>
            <p>
              The connector handles authorization and retrieval while ChatGPT handles
              interpretation and creation. Users remain in control of which boards and
              Pins are used in each conversation.
            </p>
          </div>
          <div className="steps-grid">
            <article className="card">
              <span className="card-number">01</span>
              <h3>Connect Pinterest</h3>
              <p>The creator signs in through Pinterest OAuth. The app requests only board and Pin read permissions.</p>
            </article>
            <article className="card">
              <span className="card-number">02</span>
              <h3>Select inspiration</h3>
              <p>ChatGPT lists boards, retrieves Pin metadata, or loads a small set of actual images for visual analysis.</p>
            </article>
            <article className="card">
              <span className="card-number">03</span>
              <h3>Create with context</h3>
              <p>ChatGPT extracts patterns such as composition, palette, typography, photography, styling, and recurring motifs.</p>
            </article>
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <span className="eyebrow">Built-in tools</span>
            <h2>Everything needed for inspiration-led content creation.</h2>
          </div>
          <div className="feature-grid">
            <article className="card"><h3>Board discovery</h3><p>List public, protected, and—when separately approved—secret boards with pagination.</p></article>
            <article className="card"><h3>Pin retrieval</h3><p>Read titles, descriptions, links, alt text, media metadata, and individual Pin details.</p></article>
            <article className="card"><h3>Visual loading</h3><p>Download a limited set of saved Pin images and pass them directly to the model for multimodal analysis.</p></article>
            <article className="card"><h3>Metadata search</h3><p>Run best-effort keyword matching across selected boards before opening the strongest visual references.</p></article>
            <article className="card"><h3>Multi-user OAuth</h3><p>Every creator authorizes their own Pinterest account. Connections are isolated rather than sharing one token.</p></article>
            <article className="card"><h3>Read-only by design</h3><p>No tools create, edit, move, publish, or delete Pins and boards on Pinterest.</p></article>
          </div>
        </section>

        <section className="section" id="deployment">
          <div className="status-panel">
            <div className="status-panel-header">
              <div>
                <h2>Deployment status</h2>
                <p>This page checks configuration presence without exposing any secret values.</p>
              </div>
              <span className={`status-pill ${ready ? "status-ready" : "status-setup"}`}>
                {ready ? "Configured" : "Setup required"}
              </span>
            </div>
            <div className="status-grid">
              {checks.map((check) => (
                <div className={`status-card ${check.ready ? "status-ok" : "status-missing"}`} key={check.name}>
                  <strong>{check.name}</strong>
                  <span>{check.ready ? check.description : `Missing: ${check.description}`}</span>
                </div>
              ))}
            </div>
            <div className="code-box">MCP endpoint: {publicUrl}/api/mcp</div>
            <div className="actions" style={{ marginTop: 18 }}>
              <a className="button button-primary" href="/api/health">Open health check</a>
              <a className="button" href={`${githubUrl}/blob/main/docs/DEPLOYMENT.md`} target="_blank" rel="noreferrer">Deployment guide</a>
              <a className="button" href={`${githubUrl}/blob/main/docs/CHATGPT_SETUP.md`} target="_blank" rel="noreferrer">ChatGPT setup</a>
            </div>
          </div>
        </section>

        <footer className="footer">
          <span>Open-source, read-only Pinterest inspiration connector.</span>
          <div className="footer-links">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href={githubUrl} target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </footer>
      </div>
    </main>
  );
}
