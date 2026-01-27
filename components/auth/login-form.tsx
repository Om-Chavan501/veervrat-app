"use client";

import { useState } from "react";
import { InputField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { loginAction } from "@/app/actions/auth";

interface LoginFormProps {
  error?: string | null;
}

export function LoginForm({ error }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={loginAction} className="space-y-4">
      {error && (
        <div className="rounded-[12px] border border-[#e57373] bg-[#fdecec] px-4 py-3 text-sm text-[#8d2f2f]" role="alert">
          {error}
        </div>
      )}

      <InputField
        id="email"
        name="email"
        type="email"
        label="Email"
        hint="Use the email you registered with."
        required
        autoComplete="email"
      />

      <InputField
        id="password"
        name="password"
        type={showPassword ? "text" : "password"}
        label="Password"
        hint="Enter your password to sign in."
        required
        autoComplete="current-password"
        auxiliary={
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="text-xs font-semibold text-[#6b8e4e] hover:text-[#56723f]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        }
      />

      <Button type="submit" variant="primary" className="w-full">
        Sign In
      </Button>
    </form>
  );
}
