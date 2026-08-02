import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { employees } from "@/data/employees";
import { RETENTION_MONTHS } from "@/lib/retention";
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
      <p>The n8n webhook URL is held server-side only, in <code>N8N_WEBHOOK_URL</code>. It is read exclusively inside route handlers, never prefixed with <code>NEXT_PUBLIC_</code>, and does not appear anywhere in the JavaScript shipped to the browser. The third agent&rsquo;s credentials — <code>LYZR_API_KEY</code> and <code>LYZR_AGENT_ID</code> — are held the same way. Model API keys live only in n8n credentials, and <code>scripts/rotate-key.sh</code> exists to swap a compromised or exhausted key without touching the workflow.</p>
      <p>All employee and reviewer names in this deployment are synthetic. In production, feedback author names would be pseudonymized before any text reaches the model — the audit needs to know two claims share one voice, not whose voice it is.</p>
    </Block>

    <Block title="Access scoping">
      <p>The audit trail endpoint requires an <code>employee_id</code> and filters server-side before responding. A request without one returns an empty set rather than the full table, so one person&rsquo;s verbatim feedback cannot reach a page rendering someone else&rsquo;s review.</p>
    </Block>

    <Block title="What is recorded about the reviewer">
      <p>Every draft generation, acknowledgement, edit, and decision is written to an append-only trail carrying the actor, the action, a timestamp, and a field-level before/after diff. Acknowledging a flag without amending it is recorded as explicitly as amending it — declining to act is itself a decision, attributed by name.</p>
      <p>The name is the reviewer&rsquo;s own, set from the header and recorded on everything they do from that point. It is checked against nothing: see the limits below. It exists so the trail says who claimed a decision rather than attributing every review in the deployment to one shared account.</p>
      <p>An acknowledgement is written the moment it is made, not held until approval. A reviewer who acknowledges a flag and then abandons the review has still decided something, and the trail shows it. If the audit service cannot be reached, the acknowledgement still stands in the session and the claim says plainly that the server copy is missing rather than implying a record exists.</p>
      <p>Approval is refused server-side while any high-severity flag is neither amended nor acknowledged. The refusal is enforced by the backend, not by the interface, so it cannot be bypassed by driving the API directly.</p>
    </Block>

    <Block title="What happens when a reviewer amends a claim">
      <p>An amended claim is re-checked immediately by a second, deterministic instrument that runs in the browser with no model and no network. It reads the new wording for four things: personality descriptions standing in for behaviour, absolute quantifiers, appearance or demographic descriptors, and the absence of any date, number, or named artifact a reader could verify the claim against.</p>
      <p>Its word lists and thresholds are in <code>lib/reaudit.ts</code>, stated in the open so a reviewer can read the rule that fired and disagree with it. It is deliberately not the model that wrote the audit: re-running that would be the same instrument twice, and a second independent check is what stops an edit from quietly laundering a flag.</p>
      <p>The re-check never clears anything. The original flag stands until a reviewer amends or acknowledges it, whatever the re-check concludes — passing it is evidence for a human decision, not a substitute for one.</p>
      <p>A reviewer can also ask for a second opinion on the amended sentence from a third agent, hosted by a different provider than the two that wrote and audited the draft. Two agents from one vendor sharing one prompt lineage tend to share blind spots; this one reaches what word lists cannot — sarcasm, faint praise, wording that is clean term by term and dismissive as a sentence. Only the sentence is sent: no name, no employee identifier, no source feedback, because answering whether a sentence is biased does not require knowing whose review it is.</p>
      <p>It is asked for, never automatic, and it is additive. Its keys are server-side only and when they are unset — or the service is unreachable, or its answer cannot be read — the page says so and the deterministic checks stand alone. Its verdict clears nothing and blocks nothing; it is a model&rsquo;s judgment, held to the same standard as the audit.</p>
    </Block>

    <Block title="Consent">
      <p>Every employee record carries a consent object: whether consent was granted, the date it was granted, the scope it covers, and the basis it rests on — an employment contract or an explicit opt-in. It is read, never written here. Consent belongs to the moment feedback is collected, and a system that could grant consent to itself would not be recording consent at all.</p>
      <p>Without granted consent the system will not draft a review. The check runs before anything is sent, not after a draft exists — refusing afterwards would already have put a person&rsquo;s feedback through a model they never agreed to. The employee page states which of the three states applies: recorded, withheld, or never captured.</p>
      <p>Riya Kapoor (<code>emp_004</code>) is the withheld case in this deployment. Her review cannot be generated, and the page says why rather than failing quietly.</p>
    </Block>

    <Block title="Retention and erasure">
      <p>A generated review is kept for {RETENTION_MONTHS} months from the day it was drafted. Two review cycles: long enough that this year&rsquo;s review can be read against last year&rsquo;s, short enough that a performance judgment does not follow someone indefinitely. The window is a single number in <code>lib/retention.ts</code> and the review page states the exact date it closes, so the policy is visible where the data is rather than in a document nobody opens.</p>
      <p>Erasure can be asked for at any time, on either of two grounds — the subject asked, or the window closed. The ground is required and is checked on the server, not only in the browser: an erasure with no stated reason is indistinguishable from someone quietly deleting an inconvenient review. It deletes the drafts, the final reports, and the source record the model was given.</p>
      <p>The audit trail is not deleted. Its rows survive with the actor, the action, and the timestamp intact, and their contents are emptied; a further entry records that the erasure happened, who asked, and why. A deletion that also deleted the evidence of itself would not be a governance control.</p>
      <p>The browser&rsquo;s local copy is cleared whichever way the server responds, and the page says which of the two occurred. Being told data is gone while still looking at it would be worse than either outcome stated plainly.</p>
    </Block>

    <Block title="Limits — what this system does not do">
      <ul>
        <li><strong>No authentication.</strong> The reviewer states their own name and nothing verifies it — there is no login, no session, and no way to prove the person at the keyboard is who the trail says. Attribution, not authentication. It means the trail records <em>what</em> was decided and the name claimed for it, not provably <em>who</em> decided it. An unnamed reviewer is attributed to the shared default, <code>{REVIEWER}</code>.</li>
        <li><strong>Erasure is not automatic.</strong> Nothing sweeps the database when a window closes. An expired review is marked as due and offered for erasure; a person still has to act on it. A scheduled job that deleted records unattended is the right end state and does not exist here.</li>
        <li><strong>The audit is advisory.</strong> Flags are a model&rsquo;s judgment about wording. They are evidence for a human decision, not a verdict, and both deterministic checks — the evidence balance on each review page and the re-check on an amendment — are heuristics stated in the open so they can be argued with.</li>
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
