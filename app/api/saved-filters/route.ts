import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const filters = await prisma.savedFilter.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(
    filters.map((f) => ({ ...f, config: JSON.parse(f.config) }))
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const filter = await prisma.savedFilter.create({
      data: {
        userId: body.userId || "default",
        name: body.name,
        config: JSON.stringify(body.config),
      },
    });
    return NextResponse.json(
      { ...filter, config: JSON.parse(filter.config) },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to create filter" }, { status: 400 });
  }
}
