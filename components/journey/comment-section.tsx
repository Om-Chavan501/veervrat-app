"use client";

import { useState } from "react";
import { deleteCommentAction } from "@/app/actions/comments";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "@/lib/time";

interface Comment {
  id: string;
  text: string;
  createdAt: Date;
  userId: string;
  user: {
    name: string;
    email: string | null;
  };
}

interface CommentSectionProps {
  comments: Comment[];
  reflectionId: string;
  canDelete?: boolean;
  currentUserId: string;
  ownerId: string;
  onUpdated?: () => void;
}

export function CommentSection({
  comments,
  currentUserId,
  ownerId,
  canDelete = true,
  onUpdated,
}: CommentSectionProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setError(null);
    setDeletingId(id);
    try {
      await deleteCommentAction(id);
      onUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete comment");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-3">
      {comments.length === 0 && <p className="text-sm text-[#6b6b6b]">No comments yet.</p>}
      {comments.map((comment) => {
        const isOwner = comment.userId === ownerId;
        const isSelf = comment.userId === currentUserId;
        const toneClass = isOwner
          ? "bg-[#e7f0df] border-[#c9d8bd]"
          : "bg-[#e8f2fd] border-[#c0d6f5]";
        return (
          <div
            key={comment.id}
            className={`rounded-[12px] border px-3 py-2 text-sm text-[#2c2c2c] ${toneClass}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {comment.user.name}
                  {isOwner && <span className="ml-2 text-xs text-[#4a4a4a]">(Journey Owner)</span>}
                </p>
                <p className="text-xs text-[#6b6b6b]">
                  {formatDistanceToNow(comment.createdAt)}
                </p>
              </div>
              {isSelf && canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(comment.id)}
                  disabled={deletingId === comment.id}
                >
                  {deletingId === comment.id ? "Deleting..." : "Delete"}
                </Button>
              )}
            </div>
            <p className="mt-2 leading-relaxed">{comment.text}</p>
          </div>
        );
      })}
      {error && (
        <p className="text-xs text-[#8d2f2f] bg-[#fdecec] border border-[#e57373] rounded-[10px] px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
