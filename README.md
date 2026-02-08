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
| [Zustand](https://zustand-demo.pmnd.rs/) | State management with localStorage persistence |
| [date-fns](https://date-fns.org/) | Date manipulation and formatting |
| [Lucide React](https://lucide.dev/) | Icon library |

## Getting Started

### Prerequisites

- Node.js 18.17 or later

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
pm/
├── app/
│   ├── layout.tsx          # Root layout with sidebar navigation
│   ├── page.tsx            # Dashboard page
│   ├── globals.css         # Global styles and Tailwind config
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
│   ├── store.ts            # Zustand store (tasks, projects, events)
│   └── utils.ts            # Utility functions
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Data Persistence

All data is stored in the browser's `localStorage` under the key `projectflow-store`. The app ships with sample data (3 projects, 8 tasks, 4 calendar events) that loads on first visit. Data can be exported as JSON or CSV from the Settings page.

## License

MIT
