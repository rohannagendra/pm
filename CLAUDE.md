# CLAUDE.md - ProjectFlow

## Project Overview

ProjectFlow is a client-side project management app built with Next.js 16 (App Router), React 19, TailwindCSS v4, shadcn/ui, and Zustand. All data is persisted in localStorage - there is no backend or database.

## Commands

- `npm run dev` - Start development server (Turbopack)
- `npm run build` - Production build (also runs TypeScript checking)
- `npm run start` - Serve production build
- `npm run lint` - Run ESLint

## Architecture

### State Management
- Single Zustand store at `lib/store.ts` manages all app state
- Three entity types: `Task`, `Project`, `CalendarEvent`
- Persistence via `zustand/middleware` `persist` to localStorage (key: `projectflow-store`)
- All components access state via `useAppStore()` hook

### Routing
- Next.js App Router with 5 routes: `/`, `/tasks`, `/projects`, `/calendar`, `/settings`
- Each route page is a thin wrapper that imports a component from `components/`
- Layout in `app/layout.tsx` renders the `Sidebar` component alongside page content

### Styling
- TailwindCSS v4 with `@tailwindcss/postcss` plugin
- Dark mode via `class` strategy on `<html>` element
- shadcn/ui components in `components/ui/` (16+ components from Radix UI)
- Theme variables defined in `app/globals.css` using CSS custom properties

### Key Patterns
- All page components are client components (`"use client"`) since they use Zustand
- Task status enum: `"todo" | "in-progress" | "review" | "done"`
- Task priority enum: `"low" | "medium" | "high" | "urgent"`
- IDs are generated with `Math.random().toString(36).slice(2, 11)`
- Dates stored as ISO strings, due dates as `YYYY-MM-DD` strings
- Drag-and-drop on Kanban uses native HTML5 drag events (no library)

## File Map

| File | Purpose |
|------|---------|
| `lib/store.ts` | Zustand store with all types, CRUD operations, and seed data |
| `components/sidebar.tsx` | Collapsible sidebar navigation |
| `components/dashboard-page.tsx` | Dashboard analytics and overview |
| `components/tasks-page.tsx` | Task list with filtering, sorting, CRUD dialogs |
| `components/projects-page.tsx` | Kanban board with drag-and-drop |
| `components/calendar-page.tsx` | Calendar with month/week/day views |
| `app/settings/page.tsx` | Settings (dark mode, export, data management) |
| `components/ui/*` | shadcn/ui component library |

## Dependencies of Note

- `zustand` - State management (no Redux, no Context)
- `date-fns` - All date formatting and manipulation
- `lucide-react` - All icons
- `@radix-ui/*` - Underlying primitives for shadcn/ui components
- `tailwindcss-animate` - Animation utilities for component transitions
