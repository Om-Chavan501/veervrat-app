"use client";

import { useMemo, useState } from "react";
import { InputField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { registerAction } from "@/app/actions/auth";

interface RegisterFormProps {
  error?: string | null;
}

type Strength = "Weak" | "Fair" | "Strong";

export function RegisterForm({ error }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");

  const strength: Strength = useMemo(() => {
    const hasLength = password.length >= 8;
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (hasLength && hasLetter && hasNumber && hasSpecial) return "Strong";
    if (hasLength && hasLetter && hasNumber) return "Fair";
    return "Weak";
  }, [password]);

  const strengthValue = strength === "Strong" ? 100 : strength === "Fair" ? 60 : 30;
  const strengthColor =
    strength === "Strong" ? "bg-[#6b8e4e]" : strength === "Fair" ? "bg-[#ffa726]" : "bg-[#e57373]";

  return (
    <form action={registerAction} className="space-y-4">
      {error && (
        <div className="rounded-[12px] border border-[#e57373] bg-[#fdecec] px-4 py-3 text-sm text-[#8d2f2f]" role="alert">
          {error}
        </div>
      )}

      <InputField
        id="name"
        name="name"
        type="text"
        label="Full Name"
        hint="This is shared with your Vratmitra."
        required
        autoComplete="name"
      />

      <InputField
        id="email"
        name="email"
        type="email"
        label="Email"
        hint="We never share your email."
        required
        autoComplete="email"
      />

      <InputField
        id="password"
        name="password"
        type={showPassword ? "text" : "password"}
        label="Password"
        hint="Minimum 8 characters, include letters and numbers."
        required
        minLength={8}
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
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

      <div className="space-y-2 rounded-[12px] border border-[#e5e5e5] bg-white px-4 py-3 shadow-inner">
        <div className="flex items-center justify-between text-xs font-semibold text-[#2c2c2c]">
          <span>Password strength</span>
          <span>{strength}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#f0eee8]">
          <div
            className={`h-2 rounded-full transition-all ${strengthColor}`}
            style={{ width: `${strengthValue}%` }}
          />
        </div>
        <p className="text-xs text-[#6b6b6b]">
          Use 8+ characters with a mix of letters, numbers, and a symbol for a stronger password.
        </p>
      </div>

      <InputField
        id="confirmPassword"
        name="confirmPassword"
        type={showConfirm ? "text" : "password"}
        label="Confirm Password"
        hint="Re-enter your password."
        required
        minLength={8}
        autoComplete="new-password"
        auxiliary={
          <button
            type="button"
            onClick={() => setShowConfirm((prev) => !prev)}
            className="text-xs font-semibold text-[#6b8e4e] hover:text-[#56723f]"
            aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
          >
            {showConfirm ? "Hide" : "Show"}
          </button>
        }
      />

      <Button type="submit" variant="primary" className="w-full">
        Create Account
      </Button>
    </form>
  );
}
