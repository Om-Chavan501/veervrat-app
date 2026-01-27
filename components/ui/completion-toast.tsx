"use client";

import { useEffect, useState } from "react";

interface CompletionToastProps {
  show: boolean;
  message: string;
}

export function CompletionToast({ show, message }: CompletionToastProps) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(timer);
  }, [show]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 right-6 rounded-[12px] border border-[#c9d8bd] bg-[#e7f0df] px-4 py-3 text-sm text-[#2d5a1a] shadow-soft"
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
