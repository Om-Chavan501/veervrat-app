"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface WelcomeBannerProps {
  userName: string;
  shouldShow: boolean;
}

export function WelcomeBanner({ userName, shouldShow }: WelcomeBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!shouldShow) return;
    const dismissed = localStorage.getItem("veervrat_welcome_dismissed");
    if (!dismissed) {
      setVisible(true);
    }
  }, [shouldShow]);

  const handleDismiss = () => {
    localStorage.setItem("veervrat_welcome_dismissed", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="card slide-up shadow-soft border border-[#d8d1c6] bg-gradient-to-br from-white to-[#eef3e7] rounded-[18px] overflow-hidden">
      <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[#6b6b6b]">Welcome</p>
          <h2 className="text-2xl font-bold text-[#2c2c2c]">
            Welcome to your practice space, {userName}
          </h2>
          <p className="text-sm text-[#6b6b6b]">
            Let&apos;s begin with a simple assessment to identify where to focus.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="primary" size="lg">
              <Link href="/lacunae">Start Your First Assessment</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              Dismiss
            </Button>
          </div>
        </div>
        <div className="hidden sm:block rounded-[16px] border border-[#e5e5e5] bg-white px-4 py-3 shadow-inner text-sm text-[#4a4a4a]">
          <p className="font-semibold text-[#2c2c2c]">Getting started</p>
          <ol className="mt-2 space-y-1 text-sm text-[#4a4a4a] list-decimal list-inside">
            <li>Start assessment</li>
            <li>Review results</li>
            <li>Begin journey</li>
            <li>Daily practice</li>
          </ol>
        </div>
      </div>
      <details className="border-t border-[#e5e5e5] bg-white/70 px-6 py-4">
        <summary className="text-sm font-semibold text-[#2c2c2c] cursor-pointer">
          How it works
        </summary>
        <div className="mt-2 text-sm text-[#6b6b6b] space-y-2">
          <p>Assessments surface sentences aligned to your lacunae.</p>
          <p>Choose one sentence to start a journey and log reflections daily.</p>
          <p>Invite a Vratmitra for supportive accountability when you are ready.</p>
        </div>
      </details>
    </div>
  );
}
