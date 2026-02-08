# ProjectFlow

A beautiful, feature-rich project management application built with Next.js 16, React 19, and TailwindCSS.

## Features

### Dashboard
- Welcome greeting based on time of day
- Task statistics cards (total, completed, in progress, overdue)
- Upcoming deadlines (next 7 days)
- Recent activity feed with relative timestamps
- Project progress bars with completion percentages
- Task distribution chart by status
- Priority breakdown visualization
- Quick action buttons for creating tasks, projects, and events

### Task Management
- Full CRUD operations for tasks
- Priority levels: Low, Medium, High, Urgent (color-coded badges)
- Status tracking: To Do, In Progress, Review, Done
- Due date management with overdue indicators
- Project assignment and tag system
- Filter by status, priority, and project
- Sort by due date, priority, created date, or title
- Tab-based views (All, To Do, In Progress, Review, Done)
- Search across task titles
- Create and edit tasks via modal dialogs
- Checkbox to quickly toggle task completion

### Kanban Board (Projects)
- Drag-and-drop task cards between status columns
- Project selector to filter by project or view all tasks
- Create new projects with custom name, description, and color
- Four columns: To Do, In Progress, Review, Done
- Task cards with priority indicators, due dates, tags, and project badges
- Add tasks directly to specific columns
- Column task counts
- Visual feedback during drag operations

### Calendar
- **Month View**: Full month grid with task dots and event bars, click any day for details
- **Week View**: 7-day grid with time slots and event positioning
- **Day View**: Detailed single-day view with task list and event timeline
- Navigate between months/weeks/days with prev/next buttons
- "Today" button for quick navigation
- Create events with title, date, time range, description, and color
- Quick-add tasks from any calendar day
- Day detail dialog showing all events and tasks
- Color-coded events and project-colored task indicators
- Overdue task highlighting

### Settings
- Dark mode toggle with persistent preference
- Export data as JSON (all tasks, projects, events)
- Export tasks as CSV for spreadsheet analysis
- Data summary showing counts of tasks, projects, and events
- Reset to sample data
- Delete all data (with confirmation)

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Next.js 16](https://nextjs.org/) | React framework with App Router |
| [React 19](https://react.dev/) | UI library |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [TailwindCSS v4](https://tailwindcss.com/) | Utility-first CSS |
| [shadcn/ui](https://ui.shadcn.com/) | UI component library (Radix UI primitives) |
| [Zustand](https://zustand-demo.pmnd.rs/) | Client-side state management |
| [Prisma](https://www.prisma.io/) | ORM for database access |
| [SQLite](https://www.sqlite.org/) | Embedded database (via better-sqlite3) |
| [date-fns](https://date-fns.org/) | Date manipulation and formatting |
| [Lucide React](https://lucide.dev/) | Icon library |

## Getting Started

### Prerequisites

- Node.js 18.17 or later

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database file path | `file:./prisma/dev.db` |

### Database Setup

ProjectFlow uses **Prisma** with **SQLite** for data persistence. The database file is stored locally at `prisma/dev.db`.

```bash
# Generate the Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Open Prisma Studio (GUI for browsing data)
npx prisma studio

# Seed the database with sample data
# POST to /api/seed after starting the dev server
```

### Docker Setup

Run the app in a container using Docker Compose:

```bash
# Build and start the container
docker-compose up

# Run in detached mode
docker-compose up -d

# Stop the container
docker-compose down
```

The container exposes port 3000 and persists the SQLite database in a named volume.

### Build for Production

```bash
npm run build
npm start
```

## API Routes

All data is accessed through RESTful API routes backed by Prisma and SQLite.

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/tasks` | GET, POST | List all tasks / Create a task |
| `/api/tasks/[id]` | PUT, DELETE | Update / Delete a task |
| `/api/projects` | GET, POST | List all projects / Create a project |
| `/api/projects/[id]` | PUT, DELETE | Update / Delete a project |
| `/api/events` | GET, POST | List all events / Create an event |
| `/api/events/[id]` | PUT, DELETE | Update / Delete an event |
| `/api/seed` | POST | Seed database with sample data |

## Project Structure

```
pm/
├── app/
│   ├── layout.tsx          # Root layout with sidebar navigation
│   ├── page.tsx            # Dashboard page
│   ├── globals.css         # Global styles and Tailwind config
│   ├── api/
│   │   ├── tasks/
│   │   │   ├── route.ts    # GET/POST tasks
│   │   │   └── [id]/
│   │   │       └── route.ts # PUT/DELETE task
│   │   ├── projects/
│   │   │   ├── route.ts    # GET/POST projects
│   │   │   └── [id]/
│   │   │       └── route.ts # PUT/DELETE project
│   │   ├── events/
│   │   │   ├── route.ts    # GET/POST events
│   │   │   └── [id]/
│   │   │       └── route.ts # PUT/DELETE event
│   │   └── seed/
│   │       └── route.ts    # Seed database
│   ├── calendar/
│   │   └── page.tsx        # Calendar route
│   ├── projects/
│   │   └── page.tsx        # Kanban board route
│   ├── settings/
│   │   └── page.tsx        # Settings page
│   └── tasks/
│       └── page.tsx        # Tasks route
├── components/
│   ├── sidebar.tsx         # Collapsible sidebar navigation
│   ├── dashboard-page.tsx  # Dashboard with analytics
│   ├── tasks-page.tsx      # Task management interface
│   ├── projects-page.tsx   # Kanban board with drag-and-drop
│   ├── calendar-page.tsx   # Calendar with month/week/day views
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── store.ts            # Zustand store (client state + API calls)
│   ├── prisma.ts           # Prisma client singleton
│   └── utils.ts            # Utility functions
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.mjs            # Seed data script
│   └── migrations/         # Database migrations
├── docker-compose.yml
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Data Persistence

Data is persisted in a SQLite database via Prisma ORM. The Zustand store on the client side fetches and mutates data through the API routes. The database file is stored at `prisma/dev.db` by default (configurable via `DATABASE_URL`). Sample data (3 projects, 8 tasks, 4 calendar events) can be loaded by calling the `/api/seed` endpoint.

## License

MIT
