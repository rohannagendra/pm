"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  Columns3,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/projects", label: "Projects", icon: Columns3 },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col h-screen bg-slate-900 text-slate-100 border-r border-slate-800 transition-all duration-200",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Header */}
        <div className="flex items-center h-14 px-3 border-b border-slate-800">
          <Layers className="h-6 w-6 shrink-0 text-indigo-400" />
          {!collapsed && (
            <span className="ml-2 text-lg font-semibold tracking-tight">
              ProjectFlow
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-7 w-7 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            const linkContent = (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>
      </aside>
    </TooltipProvider>
  );
}
