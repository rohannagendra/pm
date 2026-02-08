import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  calendarEvent: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { GET, POST } from "@/app/api/events/route";
import {
  GET as GET_BY_ID,
  PUT,
  DELETE,
} from "@/app/api/events/[id]/route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/events", () => {
  it("returns all events", async () => {
    mockPrisma.calendarEvent.findMany.mockResolvedValue([
      { id: "1", title: "Meeting", date: "2026-02-07" },
    ]);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
  });

  it("returns empty array when no events", async () => {
    mockPrisma.calendarEvent.findMany.mockResolvedValue([]);
    const res = await GET();
    const data = await res.json();
    expect(data).toEqual([]);
  });
});

describe("POST /api/events", () => {
  it("creates an event and returns 201", async () => {
    const event = {
      id: "1",
      title: "New",
      date: "2026-02-07",
      startTime: "09:00",
      endTime: "10:00",
      description: "",
      color: "#6366f1",
    };
    mockPrisma.calendarEvent.create.mockResolvedValue(event);
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        title: "New",
        date: "2026-02-07",
        startTime: "09:00",
        endTime: "10:00",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.title).toBe("New");
  });

  it("returns 400 on error", async () => {
    mockPrisma.calendarEvent.create.mockRejectedValue(new Error("fail"));
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ title: "Bad" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe("GET /api/events/[id]", () => {
  it("returns an event by id", async () => {
    mockPrisma.calendarEvent.findUnique.mockResolvedValue({
      id: "1",
      title: "Meeting",
    });
    const res = await GET_BY_ID(new Request("http://localhost"), {
      params: Promise.resolve({ id: "1" }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("1");
  });

  it("returns 404 when not found", async () => {
    mockPrisma.calendarEvent.findUnique.mockResolvedValue(null);
    const res = await GET_BY_ID(new Request("http://localhost"), {
      params: Promise.resolve({ id: "nope" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/events/[id]", () => {
  it("updates an event", async () => {
    mockPrisma.calendarEvent.update.mockResolvedValue({
      id: "1",
      title: "Updated",
    });
    const req = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ title: "Updated" }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: "1" }) });
    const data = await res.json();
    expect(data.title).toBe("Updated");
  });

  it("returns 400 on error", async () => {
    mockPrisma.calendarEvent.update.mockRejectedValue(new Error("fail"));
    const req = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ title: "Bad" }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/events/[id]", () => {
  it("deletes an event", async () => {
    mockPrisma.calendarEvent.delete.mockResolvedValue({});
    const res = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ id: "1" }),
    });
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("returns 404 on error", async () => {
    mockPrisma.calendarEvent.delete.mockRejectedValue(new Error("fail"));
    const res = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ id: "nope" }),
    });
    expect(res.status).toBe(404);
  });
});
