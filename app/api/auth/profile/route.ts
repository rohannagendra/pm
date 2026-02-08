import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const updates = await request.json();
    const allowed: Record<string, unknown> = {};
    if (typeof updates.name === "string") allowed.name = updates.name;
    if (typeof updates.avatarUrl === "string" || updates.avatarUrl === null) allowed.avatarUrl = updates.avatarUrl;
    if (typeof updates.timezone === "string") allowed.timezone = updates.timezone;

    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data: allowed,
      select: { id: true, name: true, email: true, avatarUrl: true, timezone: true },
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
