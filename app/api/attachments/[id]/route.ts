import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const attachment = await prisma.fileAttachment.findUnique({ where: { id } });
    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }
    try {
      await unlink(path.join(process.cwd(), "public", attachment.filepath));
    } catch {
      // file may already be deleted
    }
    await prisma.fileAttachment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete attachment" }, { status: 400 });
  }
}
