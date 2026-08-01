import type { Report } from "@/lib/types";

// Hand-written fixtures matching what the n8n pipeline should produce.
// emp_002 carries the demo: manager claims contradicted by peer feedback
// and project data, plus one citation that resolves to nothing.
const drafts: Record<string, Omit<Report, "report_id" | "created_at">> = {
  emp_001: {
    employee_id: "emp_001",
    strengths: [
      {
        text: "Consistently raises the quality of others' work through review, explaining reasoning rather than only flagging defects.",
        source_ids: ["peer_B_1", "peer_B_2"],
        flag: null,
      },
      {
        text: "Caught a double-charge edge case during review before release, preventing a customer-facing billing incident.",
        source_ids: ["manager_A_1"],
        flag: null,
      },
      {
        text: "Stays composed during production incidents and closes the loop with written postmortems.",
        source_ids: ["manager_A_2", "project_2"],
        flag: null,
      },
    ],
    growth_areas: [
      {
        text: "Design documentation lands after implementation begins, which limits the team's chance to shape the approach early.",
        source_ids: ["manager_A_1", "goal_2", "self_assessment"],
        flag: null,
      },
      {
        text: "Availability is constrained by review load, making her a bottleneck for teammates who need her time.",
        source_ids: ["peer_B_2", "meeting_note_1"],
        flag: {
          type: "vague_language",
          reasoning:
            "\"Bottleneck\" attributes a systemic workload problem to the individual. The cited sources describe review volume as an allocation issue already being addressed by capping rotations, not a personal shortfall.",
          severity: "low",
        },
      },
    ],
    impact_highlights: [
      {
        text: "Delivered the payments queue migration on schedule with p99 latency down 34% and no reported regressions in eight weeks.",
        source_ids: ["project_1", "goal_1"],
        flag: null,
      },
      {
        text: "Restored service in 47 minutes during the Q2 database incident and drove all four follow-up actions to closure.",
        source_ids: ["project_2"],
        flag: null,
      },
    ],
    goal_progress: [
      {
        text: "Payments queue migration: completed, cut over 2026-05-14 with zero rollbacks.",
        source_ids: ["goal_1"],
        flag: null,
      },
      {
        text: "Design docs before implementation: in progress, achieved on 2 of 5 major projects.",
        source_ids: ["goal_2"],
        flag: null,
      },
    ],
    overall_bias_summary:
      "One low-severity flag. Claims are well distributed across manager, peer, goal, and project sources, and no assessment rests on a single reviewer.",
    status: "pending_approval",
    reviewer: null,
    approved_at: null,
  },

  emp_002: {
    employee_id: "emp_002",
    strengths: [
      {
        text: "Ran the entire onboarding research round independently, including recruiting participants without dedicated research support.",
        source_ids: ["peer_B_1"],
        flag: null,
      },
      {
        text: "Proposed and drove the design token system to adoption across three platform teams without a formal brief.",
        source_ids: ["peer_B_2", "project_2", "goal_2"],
        flag: null,
      },
    ],
    growth_areas: [
      {
        text: "Needs to show more ownership and act as more of a self-starter.",
        source_ids: ["manager_A_1"],
        flag: {
          type: "unsupported_claim",
          reasoning:
            "No specific evidence is cited, and the claim is directly contradicted by the record: peer_B_1 and peer_B_2 both describe self-directed work, and project_2 documents an initiative he started without a brief.",
          severity: "high",
        },
      },
      {
        text: "Communication during the onboarding delay could have been stronger.",
        source_ids: ["manager_A_2", "project_1"],
        flag: {
          type: "recency_bias",
          reasoning:
            "Both manager entries are dated 2026-07 and focus on the final weeks of a twelve-month period. The 2026-02 to 2026-04 contributions recorded in peer feedback and meeting notes are absent from the manager's assessment entirely.",
          severity: "high",
        },
      },
      {
        text: "Would benefit from tighter estimate discipline on multi-quarter work.",
        source_ids: ["manager_A_3"],
        flag: {
          type: "single_source_bias",
          reasoning:
            "Rests on one reviewer with no corroboration. The retro record (meeting_note_2) attributes the schedule change to research findings rather than execution.",
          severity: "medium",
        },
      },
    ],
    impact_highlights: [
      {
        text: "Onboarding redesign raised activation from 41% to 58% and cut setup-confusion support tickets by 44%.",
        source_ids: ["project_1", "goal_1"],
        flag: null,
      },
      {
        text: "Design token system removed 62 one-off values and was adopted by web, iOS, and Android in six weeks.",
        source_ids: ["goal_2", "project_2"],
        flag: null,
      },
    ],
    goal_progress: [
      {
        text: "Ship the onboarding redesign: completed, launched 2026-06-20.",
        source_ids: ["goal_1"],
        flag: null,
      },
      {
        text: "Establish shared design tokens: completed and adopted across three platforms.",
        source_ids: ["goal_2"],
        flag: null,
      },
    ],
    overall_bias_summary:
      "Two high-severity and one medium-severity flag, all in growth areas and all originating from a single reviewer. Manager feedback is dated entirely within the final month of the review period and conflicts with peer and project evidence from earlier quarters. This section should not be approved without revision.",
    status: "pending_approval",
    reviewer: null,
    approved_at: null,
  },

  emp_003: {
    employee_id: "emp_003",
    strengths: [
      {
        text: "Analysis quality is high enough that the churn model now informs three separate retention decisions.",
        source_ids: ["manager_A_1", "project_1"],
        flag: null,
      },
      {
        text: "Dependable delivery partner across teams.",
        source_ids: ["peer_B_1"],
        flag: {
          type: "vague_language",
          reasoning:
            "The supporting source says only \"great to work with and always delivers\" with no specific behaviour or outcome. The claim cannot be acted on or disputed as written.",
          severity: "medium",
        },
      },
    ],
    growth_areas: [
      {
        text: "In executive settings, leads with methodology rather than the recommendation, delaying the decision the audience needs.",
        source_ids: ["manager_A_1", "meeting_note_1", "self_assessment"],
        flag: null,
      },
    ],
    impact_highlights: [
      {
        text: "Churn model reached 0.81 precision on held-out data and supported a campaign that recovered roughly 1,240 at-risk accounts.",
        source_ids: ["project_1", "goal_1"],
        flag: null,
      },
    ],
    goal_progress: [
      {
        text: "Ship a churn prediction model: completed, deployed 2026-04.",
        source_ids: ["goal_1"],
        flag: null,
      },
      {
        text: "Stakeholder communication workshop: in progress, enrolled but not yet completed.",
        source_ids: ["goal_2"],
        flag: null,
      },
    ],
    overall_bias_summary:
      "One medium-severity flag. Evidence base is thin overall: only one peer reviewer contributed, so several assessments rest on a narrow sample.",
    status: "pending_approval",
    reviewer: null,
    approved_at: null,
  },
};

export function mockReport(employeeId: string): Report | null {
  const d = drafts[employeeId];
  if (!d) return null;
  return {
    ...structuredClone(d),
    report_id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
}
