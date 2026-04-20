import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { auth } from "@/lib/auth";
import { getEmployeeByEntraId } from "@/lib/repositories/employee.repository";
import {
  isResumeOwnedByEmployee,
  getFullResumeForPdf,
} from "@/lib/repositories/resume.repository";
import { ResumePdfDocument } from "@/lib/pdf/ResumePdfDocument";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ resumeId: string }> },
) {
  const { resumeId } = await params;

  const session = await auth();
  if (!session?.user?.entraObjectId)
    return new NextResponse("Unauthorized", { status: 401 });

  const employee = await getEmployeeByEntraId(session.user.entraObjectId);
  if (!employee)
    return new NextResponse("Forbidden", { status: 403 });

  const role = session.user.role;
  const isHrOrAdmin = role === "HR_Revisor" || role === "Admin";

  if (!isHrOrAdmin) {
    const owned = await isResumeOwnedByEmployee(resumeId, employee.id);
    if (!owned)
      return new NextResponse("Forbidden", { status: 403 });
  }

  const data = await getFullResumeForPdf(resumeId);
  if (!data)
    return new NextResponse("Not found", { status: 404 });

  const element = React.createElement(ResumePdfDocument, { data });
  // renderToBuffer expects ReactElement<DocumentProps>; our wrapper matches at
  // runtime but the generic doesn't overlap — cast through unknown.
  const buffer = await renderToBuffer(
    element as unknown as React.ReactElement<import("@react-pdf/renderer").DocumentProps>,
  );

  const safeName = data.employee.displayName
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="resume-${safeName}.pdf"`,
    },
  });
}
