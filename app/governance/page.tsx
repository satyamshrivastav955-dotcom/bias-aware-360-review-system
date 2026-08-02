import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { employees } from "@/data/employees";
import { REVIEWER } from "@/lib/types";

// Every claim on this page describes code in this repository. Nothing here is
// aspirational — where a control does not exist, it says so.
export default function GovernancePage() {
  return <div className="app-shell"><AppHeader /><main className="desk-page">
    <p className="eyebrow">Governance</p>
    <h1>How this system handles people&rsquo;s data</h1>
    <p className="page-lede">Performance feedback is among the most sensitive data an employer holds. This page states what the system actually does with it, and where it deliberately stops short.</p>

    <Block title="What data enters the system" >
      <p>Each review reads one employee file: a self-assessment, manager and peer feedback, stated goals, project outcomes, and meeting notes. {employees.length} employee records are loaded in this deployment. No compensation, attendance, demographic, or personal contact data is read, stored, or inferred — none of it exists in the schema.</p>
    </Block>

    <Block title="Where it goes">
      <p>Feedback is stored in Postgres and sent to Gemini as synthesis input, once per draft. The model receives the feedback text and returns a cited draft plus a bias audit; it is not trained on this data and nothing is retained between requests beyond the provider&rsquo;s own processing.</p>
      <p>The n8n webhook URL is held server-side only, in <code>N8N_WEBHOOK_URL</code>. It is read exclusively inside route handlers, never prefixed with <code>NEXT_PUBLIC_</code>, and does not appear anywhere in the JavaScript shipped to the browser. Model API keys live only in n8n credentials, and <code>scripts/rotate-key.sh</code> exists to swap a compromised or exhausted key without touching the workflow.</p>
      <p>All employee and reviewer names in this deployment are synthetic. In production, feedback author names would be pseudonymized before any text reaches the model — the audit needs to know two claims share one voice, not whose voice it is.</p>
    </Block>

    <Block title="Access scoping">
      <p>The audit trail endpoint requires an <code>employee_id</code> and filters server-side before responding. A request without one returns an empty set rather than the full table, so one person&rsquo;s verbatim feedback cannot reach a page rendering someone else&rsquo;s review.</p>
    </Block>

    <Block title="What is recorded about the reviewer">
      <p>Every draft generation, acknowledgement, edit, and decision is written to an append-only trail carrying the actor, the action, a timestamp, and a field-level before/after diff. Acknowledging a flag without amending it is recorded as explicitly as amending it — declining to act is itself a decision, attributed by name.</p>
      <p>Approval is refused server-side while any high-severity flag is neither amended nor acknowledged. The refusal is enforced by the backend, not by the interface, so it cannot be bypassed by driving the API directly.</p>
    </Block>

    <Block title="Limits — what this system does not do">
      <ul>
        <li><strong>No authentication.</strong> Reviewer identity is a fixed value, <code>{REVIEWER}</code>, with no login. Every audit entry is attributed to it. This is a deliberate scope decision for a prototype, and it means the trail records <em>what</em> was decided, not provably <em>who</em> decided it.</li>
        <li><strong>No retention or deletion policy.</strong> Records persist until the database is dropped. There is no expiry, export, or subject-erasure path.</li>
        <li><strong>No consent capture.</strong> The system assumes feedback was collected lawfully upstream; it neither records nor verifies that.</li>
        <li><strong>The bias audit is not re-run after an edit.</strong> An amended claim is tagged as amended and unchecked rather than silently re-scored, so an edit never masquerades as a cleared flag.</li>
        <li><strong>The audit is advisory.</strong> Flags are a model&rsquo;s judgment about wording. They are evidence for a human decision, not a verdict, and the deterministic evidence-balance check on each review page is a heuristic stated in the open so it can be argued with.</li>
      </ul>
    </Block>

    <p className="mt-10"><Link href="/" className="work-action">&larr; Back to overview</Link></p>
  </main></div>;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-9 border-t border-[var(--editorial-rule)] pt-6">
    <h2 className="font-display text-[22px] leading-tight">{title}</h2>
    <div className="mt-3 max-w-[68ch] space-y-3 text-[15px] leading-relaxed text-[var(--editorial-muted)] [&_code]:font-mono [&_code]:text-[13px] [&_li]:mt-2 [&_strong]:text-[var(--editorial-text)] [&_ul]:list-disc [&_ul]:pl-5">{children}</div>
  </section>;
}
