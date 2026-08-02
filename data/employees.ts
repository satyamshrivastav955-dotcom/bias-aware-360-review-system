import { employeeSchema } from "@/lib/schemas";
import type { Employee } from "@/lib/types";
import emp001 from "./mock_employees/emp_001_priya_sharma.json";
import emp002 from "./mock_employees/emp_002_arjun_mehta.json";
import emp003 from "./mock_employees/emp_003_kavya_nair.json";

// known-limitation: these are the same files db/seed.sql loads into Postgres, imported
// rather than retyped. The citation drawer resolves source_ids locally, so this
// bundle and the backend's copy must not drift — one file, not two.
//
// emp_002 is the demo case: manager feedback is vague, dated entirely in the
// final month, and contradicted by peer feedback and project outcomes.
export const employees: Employee[] = [emp001, emp002, emp003].map((employee) =>
  employeeSchema.parse(employee),
);

export const getEmployee = (id: string) =>
  employees.find((e) => e.employee_id === id);
