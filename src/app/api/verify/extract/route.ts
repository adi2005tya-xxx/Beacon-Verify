import { NextRequest, NextResponse } from "next/server";
import { toText, parseDetails } from "@/lib/extract";

const MAX = 25 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
  }
  if (!/\.(docx?|pdf|txt)$/i.test(file.name || "")) {
    return NextResponse.json({ message: "Upload a DOC, DOCX, PDF or TXT file" }, { status: 400 });
  }
  if (file.size > MAX) {
    return NextResponse.json({ message: "File exceeds 25 MB limit" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const text = await toText(buffer, file.type, file.name);
  const result = parseDetails(text);

  return NextResponse.json(
    { success: true, plannerType: result.plannerType, fields: result.fields },
    { status: 201 },
  );
}
