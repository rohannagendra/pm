import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const attachments = await prisma.fileAttachment.findMany({
    where: { taskId: id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(attachments);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filepath = path.join(uploadsDir, uniqueName);
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const attachment = await prisma.fileAttachment.create({
      data: {
        taskId: id,
        filename: file.name,
        filepath: `/uploads/${uniqueName}`,
        mimetype: file.type,
        size: file.size,
      },
    });
    return NextResponse.json(attachment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to upload file" }, { status: 400 });
  }
}
