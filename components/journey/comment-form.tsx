"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { addCommentAction } from "@/app/actions/comments";

interface CommentFormProps {
  reflectionId: string;
  onPosted?: () => void;
}

export function CommentForm({ reflectionId, onPosted }: CommentFormProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!text.trim()) {
      setError("Comment cannot be empty");
      return;
    }
    setLoading(true);
    try {
      await addCommentAction(reflectionId, text);
      setText("");
      onPosted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {error && (
        <div className="rounded-[10px] border border-[#e57373] bg-[#fdecec] px-3 py-2 text-xs text-[#8d2f2f]" role="alert">
          {error}
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        className="w-full rounded-[10px] border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-[#2c2c2c] placeholder:text-[#9c9c9c] focus:border-[#6b8e4e] focus:shadow-[0_0_0_3px_rgba(107,142,78,0.15)]"
        placeholder="Leave a supportive comment..."
      />
      <Button type="submit" variant="primary" size="sm" loading={loading} disabled={loading}>
        Post Comment
      </Button>
    </form>
  );
}
