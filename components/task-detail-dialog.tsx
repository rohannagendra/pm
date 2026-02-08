"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  useAppStore,
  type Task,
  type TaskComment,
  type AppUser,
} from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  User,
  Send,
  Pencil,
  Trash2,
  X,
  Check,
  AtSign,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function UserAvatar({ user, size = "sm" }: { user: AppUser | null; size?: "sm" | "md" }) {
  const s = size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";
  if (!user) {
    return (
      <div className={`${s} rounded-full bg-muted flex items-center justify-center`}>
        <User className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      </div>
    );
  }
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.name} className={`${s} rounded-full object-cover`} />;
  }
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className={`${s} rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium`}>
      {initials}
    </div>
  );
}

// Render comment content with @mentions highlighted
function CommentContent({ content, users }: { content: string; users: AppUser[] }) {
  const parts = content.split(/(@\[[^\]]+\])/g);
  return (
    <p className="text-sm whitespace-pre-wrap">
      {parts.map((part, i) => {
        const match = part.match(/^@\[([^\]]+)\]$/);
        if (match) {
          const userId = match[1];
          const user = users.find((u) => u.id === userId);
          return (
            <span key={i} className="inline-flex items-center gap-0.5 rounded bg-primary/10 text-primary px-1 text-xs font-medium">
              <AtSign className="h-3 w-3" />
              {user?.name ?? "Unknown"}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

// Mention autocomplete dropdown
function MentionDropdown({
  users,
  query,
  onSelect,
  position,
}: {
  users: AppUser[];
  query: string;
  onSelect: (user: AppUser) => void;
  position: { top: number; left: number };
}) {
  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase())
  );
  if (filtered.length === 0) return null;
  return (
    <div
      className="absolute z-50 w-56 rounded-md border bg-popover p-1 shadow-md"
      style={{ top: position.top, left: position.left }}
    >
      {filtered.slice(0, 5).map((u) => (
        <button
          key={u.id}
          type="button"
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(u);
          }}
        >
          <UserAvatar user={u} size="sm" />
          <div className="flex-1 text-left">
            <p className="font-medium">{u.name}</p>
            <p className="text-xs text-muted-foreground">{u.email}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function CommentInput({
  taskId,
  onCommentAdded,
}: {
  taskId: string;
  onCommentAdded: (comment: TaskComment) => void;
}) {
  const users = useAppStore((s) => s.users);
  const [content, setContent] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPos, setMentionPos] = useState({ top: 0, left: 0 });
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setContent(val);

    // Check for @ trigger
    const cursorPos = e.target.selectionStart;
    const textBefore = val.slice(0, cursorPos);
    const atIdx = textBefore.lastIndexOf("@");
    if (atIdx >= 0 && (atIdx === 0 || textBefore[atIdx - 1] === " " || textBefore[atIdx - 1] === "\n")) {
      const query = textBefore.slice(atIdx + 1);
      if (!query.includes(" ") && !query.includes("\n")) {
        setMentionQuery(query);
        setShowMentions(true);
        setMentionPos({ top: 0, left: 0 });
        return;
      }
    }
    setShowMentions(false);
  }

  function handleMentionSelect(user: AppUser) {
    const cursorPos = textareaRef.current?.selectionStart ?? content.length;
    const textBefore = content.slice(0, cursorPos);
    const atIdx = textBefore.lastIndexOf("@");
    const newContent = content.slice(0, atIdx) + `@[${user.id}]` + content.slice(cursorPos) + " ";
    setContent(newContent);
    setShowMentions(false);
    textareaRef.current?.focus();
  }

  async function handleSubmit() {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (res.ok) {
        const comment = await res.json();
        onCommentAdded(comment);
        setContent("");

        // Create notifications for mentioned users
        const mentions = content.match(/@\[([^\]]+)\]/g);
        if (mentions) {
          for (const m of mentions) {
            const userId = m.slice(2, -1);
            fetch("/api/notifications", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId,
                type: "mention",
                title: "You were mentioned",
                message: `You were mentioned in a comment on task`,
                entityId: taskId,
                entityType: "task",
              }),
            }).catch(() => {});
          }
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        placeholder="Add a comment... Use @ to mention someone"
        rows={2}
        className="pr-10"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <Button
        size="icon"
        variant="ghost"
        className="absolute right-1 bottom-1 h-7 w-7"
        onClick={handleSubmit}
        disabled={!content.trim() || submitting}
      >
        <Send className="h-4 w-4" />
      </Button>
      {showMentions && (
        <MentionDropdown
          users={users}
          query={mentionQuery}
          onSelect={handleMentionSelect}
          position={{ top: -8, left: 0 }}
        />
      )}
    </div>
  );
}

function CommentItem({
  comment,
  users,
  onUpdate,
  onDelete,
}: {
  comment: TaskComment;
  users: AppUser[];
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  function handleSave() {
    if (!editContent.trim()) return;
    onUpdate(comment.id, editContent.trim());
    setEditing(false);
  }

  return (
    <div className="flex gap-2 group">
      <UserAvatar user={comment.author} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{comment.author.name}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
          <div className="ml-auto flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => { setEditing(true); setEditContent(comment.content); }}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive" onClick={() => onDelete(comment.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {editing ? (
          <div className="mt-1 space-y-1">
            <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={2} />
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X className="h-3 w-3 mr-1" />Cancel</Button>
              <Button size="sm" onClick={handleSave}><Check className="h-3 w-3 mr-1" />Save</Button>
            </div>
          </div>
        ) : (
          <CommentContent content={comment.content} users={users} />
        )}
      </div>
    </div>
  );
}

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const users = useAppStore((s) => s.users);
  const updateTask = useAppStore((s) => s.updateTask);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const fetchComments = useCallback(async (taskId: string) => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
      }
    } finally {
      setLoadingComments(false);
    }
  }, []);

  useEffect(() => {
    if (open && task) {
      fetchComments(task.id);
    } else {
      setComments([]);
    }
  }, [open, task, fetchComments]);

  if (!task) return null;

  function handleAssigneeChange(value: string) {
    const assigneeId = value === "unassigned" ? null : value;
    updateTask(task!.id, { assigneeId } as Partial<Task>);
  }

  function handleCommentAdded(comment: TaskComment) {
    setComments((prev) => [...prev, comment]);
  }

  async function handleUpdateComment(id: string, content: string) {
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const updated = await res.json();
        setComments((prev) => prev.map((c) => (c.id === id ? updated : c)));
      }
    } catch {}
  }

  async function handleDeleteComment(id: string) {
    try {
      await fetch(`/api/comments/${id}`, { method: "DELETE" });
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch {}
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-8">{task.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Task metadata */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="capitalize">{task.status}</Badge>
            <Badge variant="outline" className="capitalize">{task.priority}</Badge>
            {task.dueDate && <Badge variant="secondary">{task.dueDate}</Badge>}
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground">{task.description}</p>
          )}

          {/* Assignee picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Assignee</label>
            <Select
              value={task.assigneeId ?? "unassigned"}
              onValueChange={handleAssigneeChange}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Unassigned
                  </span>
                </SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    <span className="flex items-center gap-2">
                      <UserAvatar user={u} size="sm" />
                      {u.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Comments section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <h4 className="text-sm font-semibold">
                Comments ({comments.length})
              </h4>
            </div>

            {loadingComments ? (
              <p className="text-sm text-muted-foreground">Loading comments...</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No comments yet</p>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <CommentItem
                    key={c.id}
                    comment={c}
                    users={users}
                    onUpdate={handleUpdateComment}
                    onDelete={handleDeleteComment}
                  />
                ))}
              </div>
            )}

            <CommentInput taskId={task.id} onCommentAdded={handleCommentAdded} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export the UserAvatar for reuse
export { UserAvatar };
