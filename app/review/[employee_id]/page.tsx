import { notFound } from "next/navigation";
import { getEmployee } from "@/data/employees";
import ReviewClient from "./review-client";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ employee_id: string }>;
}) {
  const { employee_id } = await params;
  const employee = getEmployee(employee_id);
  if (!employee) notFound();
  return <ReviewClient employee={employee} />;
}
