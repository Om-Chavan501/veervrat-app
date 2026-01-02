"use client";

import { useState } from "react";
import { inviteVratmitraAction } from "@/app/actions/vratmitra";

interface InviteVratmitraFormProps {
  journeyId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function InviteVratmitraForm({
  journeyId,
  onSuccess,
  onError,
}: InviteVratmitraFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      await inviteVratmitraAction(journeyId, email);
      setMessage({
        type: "success",
        text: `Invitation sent to ${email}`,
      });
      setEmail("");
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send invitation";
      setMessage({
        type: "error",
        text: errorMessage,
      });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg bg-gray-50 p-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Invite user as Vratmitra (by email)
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          required
          disabled={isLoading}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !email}
        className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLoading ? "Sending..." : "Send Invitation"}
      </button>

      {message && (
        <div
          className={`rounded p-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}
    </form>
  );
}
