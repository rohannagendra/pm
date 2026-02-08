import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAppStore } from "@/lib/store";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function resetStore() {
  useAppStore.setState({
    tasks: [],
    projects: [],
    events: [],
    hydrated: false,
  });
}

function flushPromises() {
  return new Promise((r) => setTimeout(r, 0));
}

const sampleTask = {
  id: "task1",
  title: "Test task",
  description: "desc",
  status: "todo" as const,
  priority: "medium" as const,
  dueDate: null,
  project: null,
  tags: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  completedAt: null,
};

const sampleProject = {
  id: "proj1",
  name: "Project A",
  color: "#ff0000",
  description: "A project",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const sampleEvent = {
  id: "evt1",
  title: "Meeting",
  date: "2026-02-07",
  startTime: "09:00",
  endTime: "10:00",
  description: "Team sync",
  color: "#00ff00",
};

beforeEach(() => {
  resetStore();
  mockFetch.mockReset();
});

describe("initial state", () => {
  it("has empty arrays and hydrated false", () => {
    const state = useAppStore.getState();
    expect(state.tasks).toEqual([]);
    expect(state.projects).toEqual([]);
    expect(state.events).toEqual([]);
    expect(state.hydrated).toBe(false);
  });
});

describe("hydrate", () => {
  it("fetches all entities and sets hydrated", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/api/tasks")) return Promise.resolve({ json: () => Promise.resolve([sampleTask]) });
      if (url.includes("/api/projects")) return Promise.resolve({ json: () => Promise.resolve([sampleProject]) });
      if (url.includes("/api/events")) return Promise.resolve({ json: () => Promise.resolve([sampleEvent]) });
      return Promise.resolve({ json: () => Promise.resolve([]) });
    });

    await useAppStore.getState().hydrate();
    const state = useAppStore.getState();
    expect(state.tasks).toEqual([sampleTask]);
    expect(state.projects).toEqual([sampleProject]);
    expect(state.events).toEqual([sampleEvent]);
    expect(state.hydrated).toBe(true);
  });

  it("does not re-hydrate if already hydrated", async () => {
    useAppStore.setState({ hydrated: true });
    await useAppStore.getState().hydrate();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sets hydrated true even on fetch failure", async () => {
    mockFetch.mockRejectedValue(new Error("network error"));
    await useAppStore.getState().hydrate();
    expect(useAppStore.getState().hydrated).toBe(true);
    expect(useAppStore.getState().tasks).toEqual([]);
  });

  it("handles non-array responses gracefully", async () => {
    mockFetch.mockResolvedValue({ json: () => Promise.resolve("not an array") });
    await useAppStore.getState().hydrate();
    expect(useAppStore.getState().tasks).toEqual([]);
    expect(useAppStore.getState().hydrated).toBe(true);
  });
});

describe("seedData", () => {
  it("posts to seed endpoint then rehydrates", async () => {
    let callCount = 0;
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/api/seed")) return Promise.resolve({ ok: true });
      callCount++;
      return Promise.resolve({ json: () => Promise.resolve([]) });
    });

    await useAppStore.getState().seedData();
    expect(mockFetch).toHaveBeenCalledWith("/api/seed", { method: "POST" });
    expect(useAppStore.getState().hydrated).toBe(true);
  });
});

describe("addTask", () => {
  it("optimistically adds task then replaces with server response", async () => {
    const serverTask = { ...sampleTask, id: "server-id" };
    mockFetch.mockResolvedValue({ json: () => Promise.resolve(serverTask) });

    useAppStore.getState().addTask({
      title: "Test task",
      description: "desc",
      status: "todo",
      priority: "medium",
      dueDate: null,
      project: null,
      tags: [],
    });

    // Optimistic: task added immediately
    expect(useAppStore.getState().tasks).toHaveLength(1);
    expect(useAppStore.getState().tasks[0].title).toBe("Test task");

    await flushPromises();

    // Replaced with server version
    expect(useAppStore.getState().tasks).toHaveLength(1);
    expect(useAppStore.getState().tasks[0].id).toBe("server-id");
  });

  it("rolls back on fetch error", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));

    useAppStore.getState().addTask({
      title: "Fail task",
      description: "",
      status: "todo",
      priority: "low",
      dueDate: null,
      project: null,
      tags: [],
    });

    expect(useAppStore.getState().tasks).toHaveLength(1);
    await flushPromises();
    expect(useAppStore.getState().tasks).toHaveLength(0);
  });
});

describe("updateTask", () => {
  beforeEach(() => {
    useAppStore.setState({ tasks: [{ ...sampleTask }] });
    mockFetch.mockResolvedValue({ ok: true });
  });

  it("updates task optimistically", () => {
    useAppStore.getState().updateTask("task1", { title: "Updated" });
    expect(useAppStore.getState().tasks[0].title).toBe("Updated");
  });

  it("sets completedAt when status changes to done", () => {
    useAppStore.getState().updateTask("task1", { status: "done" });
    const task = useAppStore.getState().tasks[0];
    expect(task.status).toBe("done");
    expect(task.completedAt).not.toBeNull();
  });

  it("clears completedAt when status changes away from done", () => {
    useAppStore.setState({
      tasks: [{ ...sampleTask, status: "done", completedAt: "2026-01-01T00:00:00.000Z" }],
    });
    useAppStore.getState().updateTask("task1", { status: "todo" });
    const task = useAppStore.getState().tasks[0];
    expect(task.status).toBe("todo");
    expect(task.completedAt).toBeNull();
  });

  it("sends completedAt in PUT payload when setting done", async () => {
    useAppStore.getState().updateTask("task1", { status: "done" });
    await flushPromises();
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.completedAt).toBeTruthy();
    expect(body.status).toBe("done");
  });

  it("sends completedAt null in PUT payload when moving away from done", async () => {
    useAppStore.setState({
      tasks: [{ ...sampleTask, status: "done", completedAt: "2026-01-01T00:00:00.000Z" }],
    });
    useAppStore.getState().updateTask("task1", { status: "in-progress" });
    await flushPromises();
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.completedAt).toBeNull();
  });
});

describe("deleteTask", () => {
  beforeEach(() => {
    useAppStore.setState({ tasks: [{ ...sampleTask }] });
  });

  it("removes task optimistically", () => {
    mockFetch.mockResolvedValue({ ok: true });
    useAppStore.getState().deleteTask("task1");
    expect(useAppStore.getState().tasks).toHaveLength(0);
  });

  it("rolls back on fetch error", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));
    useAppStore.getState().deleteTask("task1");
    expect(useAppStore.getState().tasks).toHaveLength(0);
    await flushPromises();
    expect(useAppStore.getState().tasks).toHaveLength(1);
  });
});

describe("addProject", () => {
  it("optimistically adds project then replaces with server response", async () => {
    const serverProj = { ...sampleProject, id: "server-proj" };
    mockFetch.mockResolvedValue({ json: () => Promise.resolve(serverProj) });

    useAppStore.getState().addProject({
      name: "Project A",
      color: "#ff0000",
      description: "A project",
    });

    expect(useAppStore.getState().projects).toHaveLength(1);
    await flushPromises();
    expect(useAppStore.getState().projects[0].id).toBe("server-proj");
  });

  it("rolls back on error", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));
    useAppStore.getState().addProject({ name: "X", color: "#000", description: "" });
    expect(useAppStore.getState().projects).toHaveLength(1);
    await flushPromises();
    expect(useAppStore.getState().projects).toHaveLength(0);
  });
});

describe("updateProject", () => {
  it("updates project optimistically", () => {
    useAppStore.setState({ projects: [{ ...sampleProject }] });
    mockFetch.mockResolvedValue({ ok: true });
    useAppStore.getState().updateProject("proj1", { name: "Renamed" });
    expect(useAppStore.getState().projects[0].name).toBe("Renamed");
  });
});

describe("deleteProject", () => {
  beforeEach(() => {
    useAppStore.setState({ projects: [{ ...sampleProject }] });
  });

  it("removes project optimistically", () => {
    mockFetch.mockResolvedValue({ ok: true });
    useAppStore.getState().deleteProject("proj1");
    expect(useAppStore.getState().projects).toHaveLength(0);
  });

  it("rolls back on error", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));
    useAppStore.getState().deleteProject("proj1");
    await flushPromises();
    expect(useAppStore.getState().projects).toHaveLength(1);
  });
});

describe("addEvent", () => {
  it("optimistically adds event then replaces with server response", async () => {
    const serverEvt = { ...sampleEvent, id: "server-evt" };
    mockFetch.mockResolvedValue({ json: () => Promise.resolve(serverEvt) });

    const { id, ...eventInput } = sampleEvent;
    useAppStore.getState().addEvent(eventInput);

    expect(useAppStore.getState().events).toHaveLength(1);
    await flushPromises();
    expect(useAppStore.getState().events[0].id).toBe("server-evt");
  });

  it("rolls back on error", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));
    const { id, ...eventInput } = sampleEvent;
    useAppStore.getState().addEvent(eventInput);
    expect(useAppStore.getState().events).toHaveLength(1);
    await flushPromises();
    expect(useAppStore.getState().events).toHaveLength(0);
  });
});

describe("updateEvent", () => {
  it("updates event optimistically", () => {
    useAppStore.setState({ events: [{ ...sampleEvent }] });
    mockFetch.mockResolvedValue({ ok: true });
    useAppStore.getState().updateEvent("evt1", { title: "Updated meeting" });
    expect(useAppStore.getState().events[0].title).toBe("Updated meeting");
  });
});

describe("deleteEvent", () => {
  beforeEach(() => {
    useAppStore.setState({ events: [{ ...sampleEvent }] });
  });

  it("removes event optimistically", () => {
    mockFetch.mockResolvedValue({ ok: true });
    useAppStore.getState().deleteEvent("evt1");
    expect(useAppStore.getState().events).toHaveLength(0);
  });

  it("rolls back on error", async () => {
    mockFetch.mockRejectedValue(new Error("fail"));
    useAppStore.getState().deleteEvent("evt1");
    await flushPromises();
    expect(useAppStore.getState().events).toHaveLength(1);
  });
});
