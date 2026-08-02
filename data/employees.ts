import type { Employee } from "@/lib/types";
import emp001 from "./mock_employees/emp_001_priya_sharma.json";
import emp002 from "./mock_employees/emp_002_arjun_mehta.json";
import emp003 from "./mock_employees/emp_003_kavya_nair.json";
import emp004 from "./mock_employees/emp_004_riya_kapoor.json";

// ponytail: these are the same files db/seed.sql loads into Postgres, imported
// rather than retyped. The citation drawer resolves source_ids locally, so this
// bundle and the backend's copy must not drift — one file, not two.
//
// emp_002 is the demo case: manager feedback is vague, dated entirely in the
// final month, and contradicted by peer feedback and project outcomes.
//
// emp_004 is the thin-evidence case: a new joiner with one manager note and
// nothing else on file. The backend declines to draft a review for her rather
// than invent one — the review page renders that refusal, not a report.
export const employees = [emp001, emp002, emp003, emp004] as Employee[];

export const getEmployee = (id: string) =>
  employees.find((e) => e.employee_id === id);
