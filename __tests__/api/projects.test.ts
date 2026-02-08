import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  project: {
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

import { GET, POST } from "@/app/api/projects/route";
import {
  GET as GET_BY_ID,
  PUT,
  DELETE,
} from "@/app/api/projects/[id]/route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/projects", () => {
  it("returns all projects", async () => {
    mockPrisma.project.findMany.mockResolvedValue([
      { id: "1", name: "P1", color: "#fff", description: "" },
    ]);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
  });

  it("returns empty array when no projects", async () => {
    mockPrisma.project.findMany.mockResolvedValue([]);
    const res = await GET();
    const data = await res.json();
    expect(data).toEqual([]);
  });
});

describe("POST /api/projects", () => {
  it("creates a project and returns 201", async () => {
    const project = { id: "1", name: "New", color: "#6366f1", description: "" };
    mockPrisma.project.create.mockResolvedValue(project);
    mockPrisma.activityLog.create.mockResolvedValue({});
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "New" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe("New");
  });

  it("returns 400 on error", async () => {
    mockPrisma.project.create.mockRejectedValue(new Error("fail"));
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "Bad" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe("GET /api/projects/[id]", () => {
  it("returns a project by id", async () => {
    mockPrisma.project.findUnique.mockResolvedValue({ id: "1", name: "P1" });
    const res = await GET_BY_ID(new Request("http://localhost"), {
      params: Promise.resolve({ id: "1" }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe("1");
  });

  it("returns 404 when not found", async () => {
    mockPrisma.project.findUnique.mockResolvedValue(null);
    const res = await GET_BY_ID(new Request("http://localhost"), {
      params: Promise.resolve({ id: "nope" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/projects/[id]", () => {
  it("updates a project", async () => {
    mockPrisma.project.update.mockResolvedValue({ id: "1", name: "Updated" });
    mockPrisma.activityLog.create.mockResolvedValue({});
    const req = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ name: "Updated" }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: "1" }) });
    const data = await res.json();
    expect(data.name).toBe("Updated");
  });

  it("returns 400 on error", async () => {
    mockPrisma.project.update.mockRejectedValue(new Error("fail"));
    const req = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ name: "Bad" }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/projects/[id]", () => {
  it("deletes a project", async () => {
    mockPrisma.project.findUnique.mockResolvedValue({ name: "Test" });
    mockPrisma.project.delete.mockResolvedValue({});
    mockPrisma.activityLog.create.mockResolvedValue({});
    const res = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ id: "1" }),
    });
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("returns 404 on error", async () => {
    mockPrisma.project.delete.mockRejectedValue(new Error("fail"));
    const res = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ id: "nope" }),
    });
    expect(res.status).toBe(404);
  });
});
