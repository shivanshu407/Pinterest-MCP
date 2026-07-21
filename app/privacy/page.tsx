import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Pinterest Inspiration MCP.",
};

export default function PrivacyPage() {
  const operator = process.env.LEGAL_ENTITY_NAME ?? "Pinterest Inspiration MCP operator";
  const supportEmail = process.env.SUPPORT_EMAIL ?? "privacy@your-domain.com";

  return (
    <main className="legal-page">
      <a href="/">← Back to home</a>
      <h1>Privacy Policy</h1>
      <p><strong>Last updated:</strong> July 21, 2026</p>
      <p>
        This policy explains how {operator} (“we”, “us”, or “our”) handles
        information when you connect a Pinterest account to the Pinterest
        Inspiration MCP service (“Service”). The Service is designed to let an
        AI assistant retrieve visual inspiration that you choose from your own
        Pinterest boards and Pins.
      </p>

      <h2>Information we process</h2>
      <ul>
        <li><strong>Pinterest authorization data:</strong> OAuth access tokens, refresh tokens, granted scopes, token expiry information, and an internal connection identifier.</li>
        <li><strong>Pinterest content requested by you:</strong> board names, board descriptions, Pin metadata, links, alt text, and Pin images retrieved when you ask the assistant to use them.</li>
        <li><strong>Technical information:</strong> short-lived OAuth state, registered MCP client metadata, request timestamps, and limited operational logs needed to secure and troubleshoot the Service.</li>
      </ul>
      <p>
        We do not ask for or store your Pinterest password. Authorization happens
        on Pinterest through OAuth. The Service requests read permissions only and
        does not publish, edit, move, or delete your Pinterest content.
      </p>

      <h2>How we use information</h2>
      <p>We process information only to:</p>
      <ul>
        <li>authenticate your connection and keep it functioning;</li>
        <li>retrieve the boards, Pins, and images you request;</li>
        <li>return those references to the AI client you selected;</li>
        <li>protect the Service, prevent abuse, diagnose errors, and maintain reliability; and</li>
        <li>comply with legal obligations.</li>
      </ul>
      <p>We do not sell your personal information or use your Pinterest content for advertising.</p>

      <h2>Storage and retention</h2>
      <p>
        Pinterest tokens are encrypted before being stored. Active Pinterest
        connection records are configured to expire automatically after no more
        than 400 days, while registered MCP client records expire after no more
        than 365 days. Temporary authorization codes and OAuth state expire much
        sooner. Pinterest access and refresh tokens may also expire under
        Pinterest’s own rules.
      </p>
      <p>
        Pin images are fetched on demand and returned to the requesting AI client;
        this application does not intentionally create a permanent image library
        from those downloads. Infrastructure providers may retain limited logs or
        backups under their own policies.
      </p>

      <h2>Service providers and data transfers</h2>
      <p>
        We use service providers to operate the Service, including Pinterest for
        account authorization and content access, Vercel for application hosting,
        and Upstash or Vercel KV for managed data storage. When you use the Service
        from ChatGPT or another MCP client, information returned by the Service is
        also handled by that client under its own terms and privacy policy.
      </p>
      <p>
        These providers may process information in countries other than your own.
        We take reasonable steps to use providers and safeguards appropriate to the
        information processed.
      </p>

      <h2>Your choices and deletion</h2>
      <p>
        You can stop future Pinterest access by revoking the app from your
        Pinterest account settings and by disconnecting the custom app from your AI
        client. Revocation makes the Pinterest token unusable. You may request
        earlier deletion of the encrypted server-side connection record by emailing
        us from the address associated with your request and providing enough
        information to locate the connection without sending your password or token.
      </p>
      <p>
        Depending on where you live, you may have rights to access, correct, delete,
        restrict, or object to certain processing. Contact us to exercise those rights.
      </p>

      <h2>Security</h2>
      <p>
        We use measures such as OAuth, PKCE for MCP authorization, encrypted token
        storage, minimum Pinterest scopes, short-lived authorization codes, and
        restricted secret handling. No method of transmission or storage is
        completely secure, so we cannot guarantee absolute security.
      </p>

      <h2>Children</h2>
      <p>The Service is not directed to children under 13, and we do not knowingly collect their personal information.</p>

      <h2>Changes to this policy</h2>
      <p>We may update this policy as the Service changes. The date above identifies the latest revision.</p>

      <h2>Contact</h2>
      <p>
        Questions or requests can be sent to <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
        Configure a real monitored address before making the Service publicly available.
      </p>
    </main>
  );
}
