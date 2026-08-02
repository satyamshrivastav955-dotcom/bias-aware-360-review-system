-- Seed mock employees into the employees table.
-- Generated from data/mock_employees/*.json — run AFTER schema.sql.

insert into employees (employee_id, name, role, raw_data) values
('emp_001', 'Priya Sharma', 'Senior Backend Engineer', '{
  "employee_id": "emp_001",
  "name": "Priya Sharma",
  "role": "Senior Backend Engineer",
  "self_assessment": "This cycle I led the migration of our payments service from the legacy monolith to a dedicated microservice, which cut p95 checkout latency from 1.8s to 640ms. I mentored two junior engineers (Rohan and Meera) through their first production launches. I want to grow my system design skills further and take on more cross-team architecture work next cycle.",
  "manager_feedback": [
    {
      "id": "manager_A_1",
      "reviewer": "Manager A (Vikram Rao)",
      "text": "Priya delivered the payments microservice migration two weeks ahead of schedule with zero rollback incidents. Her runbook and on-call documentation were adopted as the team template. Concrete example: during the June incident (INC-4211) she diagnosed the connection-pool exhaustion in under 20 minutes.",
      "date": "2026-06"
    },
    {
      "id": "manager_A_2",
      "reviewer": "Manager A (Vikram Rao)",
      "text": "In Q1 Priya drove the database sharding proposal, presented trade-offs to the platform guild in February, and got sign-off from three teams. One growth area: she sometimes takes on too much herself instead of delegating — e.g., she personally rewrote the retry logic in April rather than handing it to Rohan, who was available.",
      "date": "2026-03"
    }
  ],
  "peer_feedback": [
    {
      "id": "peer_B_1",
      "reviewer": "Peer B (Ankit Verma)",
      "text": "Priya''s code reviews are the most thorough on the team — she caught a race condition in my idempotency-key PR (PR #892) that would have caused duplicate charges. She also ran a lunch-and-learn on Postgres locking in May that the whole team attended.",
      "date": "2026-05"
    },
    {
      "id": "peer_C_1",
      "reviewer": "Peer C (Meera Iyer)",
      "text": "As my onboarding mentor, Priya paired with me twice a week for my first two months. She let me lead the deploy of the webhook-retry feature in April while shadowing me. My only feedback: her calendar is so full it can take 2-3 days to get review time on non-urgent PRs.",
      "date": "2026-04"
    }
  ],
  "goals": [
    {
      "id": "goal_1",
      "goal": "Migrate payments service off the monolith by end of Q2",
      "status": "completed",
      "evidence": "Shipped 14 June 2026, two weeks ahead of 30 June target; p95 latency reduced 1.8s → 640ms; zero rollbacks."
    },
    {
      "id": "goal_2",
      "goal": "Mentor two junior engineers to independent production ownership",
      "status": "completed",
      "evidence": "Rohan and Meera each led a production launch (April webhook-retry, May reconciliation job) with Priya as shadow reviewer."
    },
    {
      "id": "goal_3",
      "goal": "Publish database sharding design and get cross-team sign-off",
      "status": "completed",
      "evidence": "RFC-118 approved by platform guild in February 2026 with sign-off from Payments, Ledger, and Platform teams."
    }
  ],
  "project_outcomes": [
    {
      "id": "project_1",
      "project": "Payments microservice migration",
      "outcome": "Delivered 14 June 2026, ahead of schedule. p95 checkout latency 1.8s → 640ms. Zero rollback incidents in first 45 days."
    },
    {
      "id": "project_2",
      "project": "Database sharding RFC-118",
      "outcome": "Approved February 2026; implementation scheduled for Q3 with Priya as tech lead."
    }
  ],
  "meeting_notes": [
    "1:1 (2026-05-12): Discussed delegation — Priya agreed to route at least one meaty task per sprint to Rohan.",
    "Sprint retro (2026-06-20): Team called out Priya''s incident runbook as the reason INC-4211 was resolved quickly."
  ],
  "consent": {
    "granted": true,
    "granted_at": "2026-01-14",
    "scope": "360_review",
    "basis": "employment_contract"
  }
}'::jsonb),
('emp_002', 'Arjun Mehta', 'Frontend Engineer', '{
  "employee_id": "emp_002",
  "name": "Arjun Mehta",
  "role": "Frontend Engineer",
  "self_assessment": "I shipped the new analytics dashboard in Q1, which is now used by 40+ internal users daily, and delivered the design-system component library on time in February. In June I had a rough sprint while covering for two teammates on leave, and one release slipped by three days. I''d like clearer priorities when I''m covering multiple workstreams.",
  "manager_feedback": [
    {
      "id": "manager_A_1",
      "reviewer": "Manager A (Sanjay Kulkarni)",
      "text": "Arjun lacks ownership and doesn''t take initiative on the team''s problems.",
      "date": "2026-07"
    },
    {
      "id": "manager_A_2",
      "reviewer": "Manager A (Sanjay Kulkarni)",
      "text": "Arjun consistently misses deadlines. The June release slipped and it disrupted the QA schedule.",
      "date": "2026-07"
    },
    {
      "id": "manager_A_3",
      "reviewer": "Manager A (Sanjay Kulkarni)",
      "text": "Arjun needs to be more proactive and could improve his communication with stakeholders.",
      "date": "2026-06"
    }
  ],
  "peer_feedback": [
    {
      "id": "peer_B_1",
      "reviewer": "Peer B (Divya Nair)",
      "text": "Arjun single-handedly kept the frontend on track in June while covering for two people on leave. He proactively flagged the release risk to QA a week early and re-scoped the sprint himself. The dashboard he built in Q1 saved my team hours every week.",
      "date": "2026-06"
    }
  ],
  "goals": [
    {
      "id": "goal_1",
      "goal": "Ship the internal analytics dashboard by end of Q1",
      "status": "completed",
      "evidence": "Launched 20 March 2026; 40+ daily active internal users by May."
    },
    {
      "id": "goal_2",
      "goal": "Deliver the design-system component library by end of February",
      "status": "completed",
      "evidence": "Delivered 25 February 2026, on schedule; adopted by three product squads."
    },
    {
      "id": "goal_3",
      "goal": "Reduce frontend bundle size by 25%",
      "status": "in_progress",
      "evidence": "18% reduction achieved as of June; remaining work scheduled for Q3."
    }
  ],
  "project_outcomes": [
    {
      "id": "project_1",
      "project": "Analytics dashboard",
      "outcome": "Shipped 20 March 2026, on time. 40+ daily internal users; cited by Data team as replacing a manual weekly report."
    },
    {
      "id": "project_2",
      "project": "Design-system component library",
      "outcome": "Shipped 25 February 2026, on time. Adopted by three squads; reduced duplicated UI code."
    },
    {
      "id": "project_3",
      "project": "June maintenance release",
      "outcome": "Released 3 days late (18 June vs 15 June target) while Arjun covered for two engineers on leave; no functionality cut."
    }
  ],
  "meeting_notes": [
    "Sprint planning (2026-06-02): Arjun assigned double load covering for Kunal and Sneha (both on leave through June).",
    "1:1 (2026-06-25): Arjun raised that priorities were unclear while covering multiple workstreams; asked manager for a ranked list."
  ],
  "consent": {
    "granted": true,
    "granted_at": "2026-01-20",
    "scope": "360_review",
    "basis": "employment_contract"
  }
}'::jsonb),
('emp_003', 'Kavya Nair', 'Data Analyst', '{
  "employee_id": "emp_003",
  "name": "Kavya Nair",
  "role": "Data Analyst",
  "self_assessment": "I had a good year. I worked on several dashboards and reports and collaborated well with stakeholders. I think I''m a strong team player and always willing to help out wherever needed.",
  "manager_feedback": [
    {
      "id": "manager_H_1",
      "reviewer": "Manager H",
      "text": "Kavya is a great team player and a pleasure to work with. Always positive, always helpful. Really solid year overall.",
      "date": "2026-06"
    },
    {
      "id": "manager_H_2",
      "reviewer": "Manager H",
      "text": "Kavya has been doing well. Good energy, good attitude. Keep it up.",
      "date": "2026-01"
    }
  ],
  "peer_feedback": [
    {
      "id": "peer_I_1",
      "reviewer": "Peer I (Rohan, Product Manager)",
      "text": "Kavya is very responsive and nice to work with. Her reports are always delivered on time. A really valuable member of the team.",
      "date": "2026-05"
    },
    {
      "id": "peer_J_1",
      "reviewer": "Peer J (Anita, Data Engineer)",
      "text": "Kavya built the weekly churn dashboard that the exec team now uses every Monday. She also automated the manual CSV export process, which saves me about 3 hours a week.",
      "date": "2026-04"
    }
  ],
  "goals": [
    {
      "id": "goal_1",
      "goal": "Improve reporting for the growth team",
      "status": "completed",
      "evidence": "Growth team dashboards delivered."
    },
    {
      "id": "goal_2",
      "goal": "Develop SQL and dbt skills",
      "status": "in_progress",
      "evidence": "Attending internal dbt workshops."
    }
  ],
  "project_outcomes": [
    {
      "id": "project_1",
      "project": "Churn dashboard",
      "outcome": "Weekly churn dashboard adopted by exec team for Monday reviews; automated a manual CSV export saving ~3 hrs/week of data-engineering time."
    },
    {
      "id": "project_2",
      "project": "Quarterly growth reports",
      "outcome": "Reports delivered each quarter. Feedback generally positive."
    }
  ],
  "meeting_notes": [
    "2026-03 1:1 — Discussed interest in moving toward analytics engineering; no concrete plan set yet.",
    "2026-06 team retro — Kavya thanked for being helpful and flexible during the Q2 crunch."
  ],
  "consent": {
    "granted": true,
    "granted_at": "2026-02-02",
    "scope": "360_review",
    "basis": "explicit_opt_in"
  }
}'::jsonb),
('emp_004', 'Riya Kapoor', 'Associate Software Engineer', '{
  "employee_id": "emp_004",
  "name": "Riya Kapoor",
  "role": "Associate Software Engineer",
  "self_assessment": "I joined the team five weeks ago and have mostly been onboarding. I finished the new-hire training and picked up my first two small tickets. I am still learning the codebase and our release process.",
  "manager_feedback": [
    {
      "id": "manager_K_1",
      "reviewer": "Manager K",
      "text": "Riya has settled in well so far and asks good questions in standup. It is too early in her tenure to say much more than that.",
      "date": "2026-07"
    }
  ],
  "peer_feedback": [],
  "goals": [],
  "project_outcomes": [],
  "meeting_notes": [],
  "consent": {
    "granted": false,
    "granted_at": null,
    "scope": "360_review",
    "basis": "employment_contract"
  }
}'::jsonb)
on conflict (employee_id) do update set
  raw_data = excluded.raw_data,
  name = excluded.name,
  role = excluded.role;
