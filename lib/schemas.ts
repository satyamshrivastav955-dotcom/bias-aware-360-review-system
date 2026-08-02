import { z } from "zod";

export const FLAG_TYPES = [
  "unsupported_claim",
  "recency_bias",
  "single_source_bias",
  "vague_language",
  "contradiction",
] as const;

export const SECTION_KEYS = [
  "strengths",
  "growth_areas",
  "impact_highlights",
  "goal_progress",
] as const;

export const severitySchema = z.enum(["low", "medium", "high"]);
export const flagTypeSchema = z.enum(FLAG_TYPES);
export const reportStatusSchema = z.enum([
  "pending_approval",
  "approved",
  "rejected",
]);

export const flagSchema = z.object({
  type: flagTypeSchema,
  reasoning: z.string().trim().min(1),
  severity: severitySchema,
});

export const claimSchema = z.object({
  text: z.string().trim().min(1),
  source_ids: z.array(z.string().trim().min(1)).min(1),
  flag: flagSchema.nullable(),
});

export const reportSchema = z.object({
  report_id: z.string().trim().min(1),
  employee_id: z.string().trim().min(1),
  strengths: z.array(claimSchema),
  growth_areas: z.array(claimSchema),
  impact_highlights: z.array(claimSchema),
  goal_progress: z.array(claimSchema),
  overall_bias_summary: z.string(),
  status: reportStatusSchema,
  reviewer: z.string().nullable(),
  approved_at: z.string().nullable(),
  created_at: z.string(),
  name: z.string().optional(),
  role: z.string().optional(),
  audit_status: z.enum(["complete", "incomplete"]).default("complete"),
  audited_claims: z.number().int().nonnegative().optional(),
  stripped_uncited_count: z.number().int().nonnegative().default(0),
});

export const employeeSchema = z.object({
  employee_id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  role: z.string().trim().min(1),
  self_assessment: z.string(),
  manager_feedback: z.array(
    z.object({
      id: z.string().trim().min(1),
      reviewer: z.string().trim().min(1),
      text: z.string().trim().min(1),
      date: z.string().regex(/^\d{4}-\d{2}$/),
    }),
  ),
  peer_feedback: z.array(
    z.object({
      id: z.string().trim().min(1),
      reviewer: z.string().trim().min(1),
      text: z.string().trim().min(1),
      date: z.string().regex(/^\d{4}-\d{2}$/),
    }),
  ),
  goals: z.array(
    z.object({
      id: z.string().trim().min(1),
      goal: z.string().trim().min(1),
      status: z.enum(["completed", "in_progress"]),
      evidence: z.string().trim().min(1),
    }),
  ),
  project_outcomes: z.array(
    z.object({
      id: z.string().trim().min(1),
      project: z.string().trim().min(1),
      outcome: z.string().trim().min(1),
    }),
  ),
  meeting_notes: z.array(z.string().trim().min(1)),
  consent: z
    .object({
      granted: z.boolean(),
      // Validated month/day, so 2026-13-99 is a shape mismatch, not a date.
      granted_at: z
        .string()
        .regex(/^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/)
        .nullable(),
      scope: z.literal("360_review"),
      basis: z.enum(["employment_contract", "explicit_opt_in"]),
    })
    .optional(),
});

export const editedFieldsSchema = z
  .object({
    strengths: z.array(claimSchema).optional(),
    growth_areas: z.array(claimSchema).optional(),
    impact_highlights: z.array(claimSchema).optional(),
    goal_progress: z.array(claimSchema).optional(),
  })
  .strict();

export const generateRequestSchema = z.object({
  employee_id: z.string().trim().min(1),
});

export const approveRequestSchema = z.object({
  report_id: z.string().trim().min(1),
  action: z.enum(["approved", "rejected"]),
  reviewer: z.string().trim().min(1),
  edits: editedFieldsSchema.optional(),
  acknowledged_refs: z.array(z.string().regex(/^\w+\[\d+\]$/)).optional(),
});

// One flag acknowledged, recorded the moment the reviewer clicks — not held
// until approval. A reviewer who acknowledges and then abandons the review has
// still made a decision, and the trail has to show it.
export const acknowledgeRequestSchema = z.object({
  report_id: z.string().trim().min(1),
  employee_id: z.string().trim().min(1),
  reviewer: z.string().trim().min(1),
  point_ref: z.string().regex(/^\w+\[\d+\]$/),
  flag_type: z.string().trim().min(1),
});

// Erasure of one employee's generated reviews. A reason is required: an
// erasure with no stated ground is indistinguishable from someone deleting
// evidence, and the trail keeps the reason after the reports are gone.
export const eraseRequestSchema = z.object({
  employee_id: z.string().trim().min(1),
  reviewer: z.string().trim().min(1),
  reason: z.enum(["subject_request", "retention_expired"]),
});

// A second opinion on one amended claim. Only the wording travels — no name,
// no employee id, no source text. The question is whether this sentence is
// biased, and answering it does not require knowing whose review it is.
export const reauditRequestSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  original_flag_type: flagTypeSchema.optional(),
});

export const approveResponseSchema = z.object({
  report_id: z.string().trim().min(1),
  status: reportStatusSchema,
  reviewer: z.string().trim().min(1),
  approved_at: z.string().nullable(),
});

export const serverAuditEntrySchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  report_id: z.string().trim().min(1),
  employee_id: z.string().trim().min(1),
  actor: z.string().trim().min(1),
  action: z.string().trim().min(1),
  at: z.string().trim().min(1),
  report_status: reportStatusSchema,
  diff: z
    .object({
      edits: z
        .array(
          z.object({
            point_ref: z.string(),
            before: z.string(),
            after: z.string().nullable(),
          }),
        )
        .optional(),
      acknowledged_refs: z.array(z.string()).optional(),
    })
    .nullable(),
});

export const serverAuditEntriesSchema = z.array(serverAuditEntrySchema);

export function parseJsonBody(text: string): unknown {
  if (!text.trim()) return null;
  return JSON.parse(text) as unknown;
}
