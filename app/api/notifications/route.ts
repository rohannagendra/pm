import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notifications);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const notification = await prisma.notification.create({
      data: {
        userId: body.userId,
        type: body.type,
        title: body.title,
        message: body.message,
        entityId: body.entityId ?? null,
        entityType: body.entityType ?? null,
      },
    });
    return NextResponse.json(notification, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create notification" }, { status: 400 });
  }
}
