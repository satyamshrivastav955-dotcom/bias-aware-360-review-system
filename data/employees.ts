import type { Employee } from "@/lib/types";

// emp_002 is the demo case: manager feedback is vague, recent, and
// contradicted by both peer feedback and project outcomes.
export const employees: Employee[] = [
  {
    employee_id: "emp_001",
    name: "Priya Sharma",
    role: "Senior Backend Engineer",
    self_assessment:
      "I led the payments migration this year and kept the team unblocked through the Q2 incident. I want to move toward more architectural ownership. I know my written design docs land late and I am working on that.",
    manager_feedback: [
      {
        id: "manager_A_1",
        reviewer: "Arjun Mehta",
        text: "Priya carried the payments migration. She caught the double-charge edge case in review before it shipped, which would have been a serious customer-facing incident. Design docs consistently arrive after implementation has started.",
        date: "2026-04",
      },
      {
        id: "manager_A_2",
        reviewer: "Arjun Mehta",
        text: "Strong quarter. Handled the Q2 database incident calmly and wrote the postmortem the same week.",
        date: "2026-06",
      },
    ],
    peer_feedback: [
      {
        id: "peer_B_1",
        reviewer: "Dev Krishnan",
        text: "Best code reviewer on the team. She explains why something is wrong instead of just flagging it, which has genuinely made me a better engineer.",
        date: "2026-03",
      },
      {
        id: "peer_B_2",
        reviewer: "Sana Iqbal",
        text: "Reliable and calm under pressure. Sometimes hard to get time with her because she is pulled into so many reviews.",
        date: "2026-05",
      },
    ],
    goals: [
      {
        id: "goal_1",
        goal: "Migrate the payments service off the legacy queue",
        status: "completed",
        evidence:
          "Cutover completed 2026-05-14. Zero rollbacks, p99 latency down 34%.",
      },
      {
        id: "goal_2",
        goal: "Publish design docs before implementation on all major work",
        status: "in_progress",
        evidence: "2 of 5 projects this year had docs published before code.",
      },
    ],
    project_outcomes: [
      {
        id: "project_1",
        project: "Payments queue migration",
        outcome:
          "Shipped on schedule. p99 latency 340ms to 224ms. No customer-reported regressions in 8 weeks.",
      },
      {
        id: "project_2",
        project: "Q2 database incident response",
        outcome:
          "Recovery in 47 minutes. Postmortem produced 4 action items, all closed.",
      },
    ],
    meeting_notes: [
      "Skip-level 2026-05: Priya raised that review load is crowding out her own project time. Agreed to cap her at 3 review rotations per week.",
      "Planning 2026-06: volunteered to own the notification service redesign next quarter.",
    ],
  },

  {
    employee_id: "emp_002",
    name: "Rohan Verma",
    role: "Product Designer",
    self_assessment:
      "I shipped the onboarding redesign and the design system tokens this year. The redesign took longer than planned because we changed direction twice after research, but the final numbers were good. I would like more input earlier in scoping.",
    manager_feedback: [
      {
        id: "manager_A_1",
        reviewer: "Neha Kapoor",
        text: "Rohan needs to show more ownership and be more proactive. Not really a self-starter yet.",
        date: "2026-07",
      },
      {
        id: "manager_A_2",
        reviewer: "Neha Kapoor",
        text: "The onboarding project slipped its original date. Communication during that period could have been better.",
        date: "2026-07",
      },
    ],
    peer_feedback: [
      {
        id: "peer_B_1",
        reviewer: "Ishaan Rao",
        text: "Rohan ran the entire onboarding research round himself, including recruiting participants when we had no research support. He flagged the drop-off problem in February, months before anyone else was looking at it.",
        date: "2026-03",
      },
      {
        id: "peer_B_2",
        reviewer: "Aditi Nair",
        text: "He proposed the design token system unprompted and drove it to adoption across three teams. Easily the most self-directed work I saw this year.",
        date: "2026-04",
      },
    ],
    goals: [
      {
        id: "goal_1",
        goal: "Ship the onboarding redesign",
        status: "completed",
        evidence:
          "Launched 2026-06-20. Activation rate 41% to 58% over the first four weeks.",
      },
      {
        id: "goal_2",
        goal: "Establish shared design tokens",
        status: "completed",
        evidence: "Adopted by web, iOS, and Android. 62 one-off values removed.",
      },
    ],
    project_outcomes: [
      {
        id: "project_1",
        project: "Onboarding redesign",
        outcome:
          "Activation 41% to 58%. Support tickets tagged 'setup confusion' down 44%. Shipped 3 weeks past original estimate after two research-driven scope changes.",
      },
      {
        id: "project_2",
        project: "Design token system",
        outcome:
          "Initiated by Rohan without a formal brief. Adopted across 3 platform teams in 6 weeks.",
      },
    ],
    meeting_notes: [
      "Design review 2026-02: Rohan presented drop-off analysis unprompted, which became the basis for the whole redesign.",
      "Retro 2026-06: team agreed the two scope changes came from research findings, not from execution delays.",
    ],
  },

  {
    employee_id: "emp_003",
    name: "Meera Joshi",
    role: "Data Analyst",
    self_assessment:
      "Built the churn model and the exec dashboard. I am strongest on analysis and weakest on presenting to non-technical stakeholders, which I want to work on.",
    manager_feedback: [
      {
        id: "manager_A_1",
        reviewer: "Vikram Desai",
        text: "Meera's churn model is now the input to three separate retention decisions. Her analysis quality is exceptional. In exec settings she tends to lead with methodology rather than the recommendation.",
        date: "2026-05",
      },
    ],
    peer_feedback: [
      {
        id: "peer_B_1",
        reviewer: "Tanvi Bhat",
        text: "She is great to work with and always delivers.",
        date: "2026-06",
      },
    ],
    goals: [
      {
        id: "goal_1",
        goal: "Ship a churn prediction model",
        status: "completed",
        evidence: "Deployed 2026-04. Precision 0.81 on the held-out quarter.",
      },
      {
        id: "goal_2",
        goal: "Run a stakeholder communication workshop",
        status: "in_progress",
        evidence: "Enrolled, not yet completed.",
      },
    ],
    project_outcomes: [
      {
        id: "project_1",
        project: "Churn prediction model",
        outcome:
          "Drove a targeted retention campaign that recovered an estimated 1,240 at-risk accounts.",
      },
    ],
    meeting_notes: [
      "Exec review 2026-05: presentation ran long on methodology, recommendation came in the final two minutes.",
    ],
  },
];

export const getEmployee = (id: string) =>
  employees.find((e) => e.employee_id === id);
