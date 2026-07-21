import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for Pinterest Inspiration MCP.",
};

export default function TermsPage() {
  const operator = process.env.LEGAL_ENTITY_NAME ?? "Pinterest Inspiration MCP operator";
  const supportEmail = process.env.SUPPORT_EMAIL ?? "support@your-domain.com";

  return (
    <main className="legal-page">
      <a href="/">← Back to home</a>
      <h1>Terms of Service</h1>
      <p><strong>Last updated:</strong> July 21, 2026</p>
      <p>
        These Terms govern your use of the Pinterest Inspiration MCP service
        (“Service”) operated by {operator}. By connecting or using the Service,
        you agree to these Terms.
      </p>

      <h2>What the Service does</h2>
      <p>
        The Service provides a read-only connection between an MCP-compatible AI
        client and a Pinterest account authorized by the user. It can retrieve
        boards, Pin metadata, and selected Pin images so an AI assistant can analyze
        visual references. It does not provide tools to publish, edit, move, or delete
        Pinterest content.
      </p>

      <h2>Eligibility and account responsibility</h2>
      <p>
        You must be legally able to enter into these Terms and must comply with
        Pinterest’s terms, your AI client’s terms, and applicable law. You are
        responsible for the Pinterest account you authorize and for prompts or
        outputs created using your connected content.
      </p>

      <h2>Your content and permissions</h2>
      <p>
        You retain any rights you have in your content. You grant us only the limited
        permission needed to retrieve and transmit the boards, Pins, metadata, and
        images you request through the Service. You represent that you are authorized
        to connect the account and use the selected references for your intended purpose.
      </p>
      <p>
        AI-generated output should be treated as a new creative draft, not as proof
        that you have permission to reproduce a third party’s work. You remain
        responsible for reviewing outputs for copyright, trademark, publicity,
        accuracy, platform compliance, and other legal concerns before publication.
      </p>

      <h2>Acceptable use</h2>
      <p>You may not use the Service to:</p>
      <ul>
        <li>access an account or content without authorization;</li>
        <li>circumvent platform limits, security controls, or access restrictions;</li>
        <li>collect credentials, tokens, or personal information unlawfully;</li>
        <li>infringe intellectual property, privacy, or other rights;</li>
        <li>introduce malware, overload the Service, or interfere with other users; or</li>
        <li>use the Service for unlawful, deceptive, or abusive activity.</li>
      </ul>

      <h2>Third-party services</h2>
      <p>
        The Service depends on third parties, including Pinterest, hosting and storage
        providers, and the MCP-compatible AI client you choose. Their services may
        change, become unavailable, impose limits, or process information under their
        own terms. The Service is not endorsed by or affiliated with Pinterest unless
        expressly stated otherwise.
      </p>

      <h2>Beta service and availability</h2>
      <p>
        The Service may be offered as an experimental or beta product. Features,
        endpoints, access requirements, and availability may change. We may suspend
        or discontinue all or part of the Service, including to address security,
        legal, platform-policy, or reliability concerns.
      </p>

      <h2>Disclaimers</h2>
      <p>
        To the maximum extent permitted by law, the Service is provided “as is” and
        “as available” without warranties of any kind, including warranties of
        merchantability, fitness for a particular purpose, non-infringement, or
        uninterrupted operation. We do not guarantee that retrieved content or
        AI-generated output will be accurate, complete, unique, lawful, or suitable
        for publication.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, we will not be liable for indirect,
        incidental, special, consequential, exemplary, or punitive damages, or for
        loss of profits, data, goodwill, content, or business opportunities arising
        from the Service. Where liability cannot be excluded, our aggregate liability
        will not exceed the amount you paid us for the Service during the three months
        before the event giving rise to the claim, or USD 100 if the Service was free.
      </p>

      <h2>Termination</h2>
      <p>
        You may stop using the Service at any time by disconnecting it from your AI
        client and revoking Pinterest authorization. We may restrict or terminate
        access when reasonably necessary to protect users, comply with law or platform
        rules, or enforce these Terms.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these Terms. Continued use after an updated version becomes
        effective means you accept the revised Terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these Terms can be sent to <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
        Configure a real monitored address before public launch.
      </p>
    </main>
  );
}
