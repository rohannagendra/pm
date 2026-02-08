"use client";

import { useEffect } from "react";
import { useAppStore, type ActivityLogEntry } from "@/lib/store";
import { UserAvatar } from "@/components/task-detail-dialog";
import { formatDistanceToNow } from "date-fns";
import {
  Plus,
  Pencil,
  Trash2,
  MessageSquare,
  CheckCircle,
} from "lucide-react";

const ACTION_ICONS: Record<string, typeof Plus> = {
  created: Plus,
  updated: Pencil,
  deleted: Trash2,
  commented: MessageSquare,
  completed: CheckCircle,
};

const ACTION_COLORS: Record<string, string> = {
  created: "text-blue-500",
  updated: "text-amber-500",
  deleted: "text-red-500",
  commented: "text-purple-500",
  completed: "text-emerald-500",
};

function ActivityItem({ activity }: { activity: ActivityLogEntry }) {
  const Icon = ACTION_ICONS[activity.action] ?? Pencil;
  const color = ACTION_COLORS[activity.action] ?? "text-muted-foreground";
  let meta: Record<string, string> = {};
  try {
    meta = JSON.parse(activity.metadata);
  } catch {}

  const entityLabel = meta.title || meta.name || activity.entityType;

  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {activity.user && <UserAvatar user={activity.user} size="sm" />}
          <span className="text-sm font-medium">
            {activity.user?.name ?? "System"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="capitalize">{activity.action}</span>{" "}
          {activity.entityType}{" "}
          {entityLabel && (
            <span className="font-medium text-foreground">{entityLabel}</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

export function ActivityFeed({ limit = 10 }: { limit?: number }) {
  const activities = useAppStore((s) => s.activities);
  const fetchActivities = useAppStore((s) => s.fetchActivities);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const displayed = activities.slice(0, limit);

  if (displayed.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No recent activity
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {displayed.map((a) => (
        <ActivityItem key={a.id} activity={a} />
      ))}
    </div>
  );
}
