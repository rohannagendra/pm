import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const adapter = new PrismaBetterSqlite3({ url: `file:${join(__dirname, "..", "dev.db")}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.calendarEvent.deleteMany();

  await prisma.project.createMany({
    data: [
      { id: "proj-1", name: "Website Redesign", color: "#6366f1", description: "Complete overhaul of the company website with modern design patterns", createdAt: new Date("2026-01-10T09:00:00.000Z") },
      { id: "proj-2", name: "Mobile App", color: "#f59e0b", description: "Cross-platform mobile application for iOS and Android", createdAt: new Date("2026-01-15T09:00:00.000Z") },
      { id: "proj-3", name: "API Integration", color: "#10b981", description: "Third-party API integrations and internal microservices", createdAt: new Date("2026-01-20T09:00:00.000Z") },
    ],
  });

  await prisma.task.createMany({
    data: [
      { id: "task-1", title: "Design homepage mockup", description: "Create high-fidelity mockups for the new homepage layout", status: "done", priority: "high", dueDate: "2026-02-01", project: "proj-1", tags: JSON.stringify(["design", "ui"]), createdAt: new Date("2026-01-12T10:00:00.000Z"), completedAt: new Date("2026-01-30T14:00:00.000Z") },
      { id: "task-2", title: "Implement authentication flow", description: "Set up login, registration, and password reset pages", status: "in-progress", priority: "urgent", dueDate: "2026-02-10", project: "proj-1", tags: JSON.stringify(["frontend", "auth"]), createdAt: new Date("2026-01-15T10:00:00.000Z") },
      { id: "task-3", title: "Set up CI/CD pipeline", description: "Configure GitHub Actions for automated testing and deployment", status: "review", priority: "medium", dueDate: "2026-02-08", project: "proj-3", tags: JSON.stringify(["devops"]), createdAt: new Date("2026-01-18T10:00:00.000Z") },
      { id: "task-4", title: "Create onboarding screens", description: "Design and implement the onboarding flow for new users", status: "todo", priority: "medium", dueDate: "2026-02-15", project: "proj-2", tags: JSON.stringify(["design", "mobile"]), createdAt: new Date("2026-01-20T10:00:00.000Z") },
      { id: "task-5", title: "Write API documentation", description: "Document all REST API endpoints with examples", status: "todo", priority: "low", dueDate: "2026-02-20", project: "proj-3", tags: JSON.stringify(["docs"]), createdAt: new Date("2026-01-22T10:00:00.000Z") },
      { id: "task-6", title: "Performance audit", description: "Run Lighthouse and optimize Core Web Vitals scores", status: "todo", priority: "high", dueDate: "2026-02-12", project: "proj-1", tags: JSON.stringify(["performance"]), createdAt: new Date("2026-01-25T10:00:00.000Z") },
      { id: "task-7", title: "Push notification system", description: "Implement push notifications for iOS and Android", status: "in-progress", priority: "high", dueDate: "2026-02-18", project: "proj-2", tags: JSON.stringify(["mobile", "backend"]), createdAt: new Date("2026-01-28T10:00:00.000Z") },
      { id: "task-8", title: "Database migration scripts", description: "Create migration scripts for the new schema changes", status: "done", priority: "urgent", dueDate: "2026-02-03", project: "proj-3", tags: JSON.stringify(["backend", "database"]), createdAt: new Date("2026-01-14T10:00:00.000Z"), completedAt: new Date("2026-02-02T16:00:00.000Z") },
    ],
  });

  await prisma.calendarEvent.createMany({
    data: [
      { id: "evt-1", title: "Sprint Planning", date: "2026-02-09", startTime: "09:00", endTime: "10:30", description: "Plan tasks for the upcoming sprint", color: "#6366f1" },
      { id: "evt-2", title: "Design Review", date: "2026-02-11", startTime: "14:00", endTime: "15:00", description: "Review homepage mockups with stakeholders", color: "#f59e0b" },
      { id: "evt-3", title: "Team Standup", date: "2026-02-07", startTime: "09:30", endTime: "09:45", description: "Daily standup meeting", color: "#10b981" },
      { id: "evt-4", title: "Client Demo", date: "2026-02-14", startTime: "11:00", endTime: "12:00", description: "Demo progress on website redesign to the client", color: "#ef4444" },
    ],
  });

  console.log("Seeded 3 projects, 8 tasks, 4 calendar events.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
