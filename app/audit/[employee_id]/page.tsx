import { notFound } from "next/navigation";
import { getEmployee } from "@/data/employees";
import AuditClient from "./audit-client";

export default async function AuditPage({
  params,
}: {
  params: Promise<{ employee_id: string }>;
}) {
  const { employee_id } = await params;
  const employee = getEmployee(employee_id);
  if (!employee) notFound();
  return <AuditClient employee={employee} />;
}
