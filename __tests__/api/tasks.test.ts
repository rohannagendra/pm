import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  task: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  activityLog: {
    create: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn().mockResolvedValue(null),
}));

import { GET, POST } from "@/app/api/tasks/route";
import {
  GET as GET_BY_ID,
  PUT,
  DELETE,
} from "@/app/api/tasks/[id]/route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/tasks", () => {
  it("returns tasks with tags parsed from JSON", async () => {
    mockPrisma.task.findMany.mockResolvedValue([
      {
        id: "1",
        title: "Test",
        tags: '["a","b"]',
        _count: { comments: 0 },
        dependencies: [],
        subtasks: [],
        timeEntries: [],
        attachments: [],
        assignee: null,
      },
    ]);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data[0].id).toBe("1");
    expect(data[0].tags).toEqual(["a", "b"]);
    expect(data[0].commentCount).toBe(0);
  });

  it("returns empty array when no tasks", async () => {
    mockPrisma.task.findMany.mockResolvedValue([]);
    const res = await GET();
    const data = await res.json();
    expect(data).toEqual([]);
  });
});

describe("POST /api/tasks", () => {
  it("creates a task and returns 201", async () => {
    const created = {
      id: "1",
      title: "New",
      description: "",
      status: "todo",
      priority: "medium",
      dueDate: null,
      project: null,
      tags: '["x"]',
      createdAt: new Date().toISOString(),
      subtasks: [],
      dependencies: [],
      timeEntries: [],
      attachments: [],
      assignee: null,
      _count: { comments: 0 },
    };
    mockPrisma.task.create.mockResolvedValue(created);
    mockPrisma.activityLog.create.mockResolvedValue({});
    const req = new Request("http://localhost/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title: "New", tags: ["x"] }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.tags).toEqual(["x"]);
  });

  it("returns 400 on error", async () => {
    mockPrisma.task.create.mockRejectedValue(new Error("fail"));
    const req = new Request("http://localhost/api/tasks", {
      method: "POST",
      body: JSON.stringify({ title: "Bad" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe("GET /api/tasks/[id]", () => {
  it("returns a task by id", async () => {
    mockPrisma.task.findUnique.mockResolvedValue({
      id: "1",
      title: "Test",
      tags: '[]',
    });
    const res = await GET_BY_ID(new Request("http://localhost"), {
      params: Promise.resolve({ id: "1" }),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.id).toBe("1");
  });

  it("returns 404 when not found", async () => {
    mockPrisma.task.findUnique.mockResolvedValue(null);
    const res = await GET_BY_ID(new Request("http://localhost"), {
      params: Promise.resolve({ id: "nope" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/tasks/[id]", () => {
  it("updates a task", async () => {
    mockPrisma.task.update.mockResolvedValue({
      id: "1",
      title: "Updated",
      tags: '["new"]',
    });
    mockPrisma.activityLog.create.mockResolvedValue({});
    const req = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ title: "Updated", tags: ["new"] }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: "1" }) });
    const data = await res.json();
    expect(data.title).toBe("Updated");
    expect(data.tags).toEqual(["new"]);
  });

  it("returns 400 on error", async () => {
    mockPrisma.task.update.mockRejectedValue(new Error("fail"));
    const req = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ title: "Bad" }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/tasks/[id]", () => {
  it("deletes a task", async () => {
    mockPrisma.task.findUnique.mockResolvedValue({ title: "Test" });
    mockPrisma.task.delete.mockResolvedValue({});
    mockPrisma.activityLog.create.mockResolvedValue({});
    const res = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ id: "1" }),
    });
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("returns 404 on error", async () => {
    mockPrisma.task.delete.mockRejectedValue(new Error("fail"));
    const res = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ id: "nope" }),
    });
    expect(res.status).toBe(404);
  });
});
