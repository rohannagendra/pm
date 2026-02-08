import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const events = await prisma.calendarEvent.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(events);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event = await prisma.calendarEvent.create({
      data: {
        title: body.title,
        date: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
        description: body.description ?? "",
        color: body.color ?? "#6366f1",
        recurrence: body.recurrence ?? null,
        timezone: body.timezone ?? null,
      },
    });
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create event" }, { status: 400 });
  }
}
