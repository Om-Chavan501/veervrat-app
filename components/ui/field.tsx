import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

interface BaseFieldProps {
  label: string;
  hint?: string;
  error?: string;
  auxiliary?: ReactNode;
  optional?: boolean;
  showCount?: boolean;
}

type InputFieldProps = BaseFieldProps & InputHTMLAttributes<HTMLInputElement>;
type TextAreaFieldProps = BaseFieldProps &
  TextareaHTMLAttributes<HTMLTextAreaElement>;

export function InputField({
  label,
  hint,
  error,
  className,
  auxiliary,
  optional = false,
  ...props
}: InputFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-semibold text-[#2c2c2c]">
          {label}
          {optional ? (
            <span className="ml-1 text-xs font-normal text-[#6b6b6b]">
              (optional)
            </span>
          ) : null}
        </label>
        {auxiliary}
      </div>

      <input
        className={cn(
          "w-full rounded-[12px] border border-[#e5e5e5] bg-white px-3.5 py-3 text-sm text-[#2c2c2c] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#6b8e4e] focus:shadow-[0_0_0_4px_rgba(107,142,78,0.15)] placeholder:text-[#9c9c9c]",
          error ? "border-[#e57373] focus:shadow-[0_0_0_4px_rgba(229,115,115,0.25)]" : ""
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={hint ? `${props.id}-hint` : undefined}
        {...props}
      />

      <div className="flex items-center justify-between">
        {hint ? (
          <p id={`${props.id}-hint`} className="helper-text">
            {hint}
          </p>
        ) : (
          <span />
        )}
        {error ? (
          <p className="error-text" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  className,
  auxiliary,
  optional = false,
  showCount = true,
  value,
  maxLength,
  ...props
}: TextAreaFieldProps) {
  const currentLength =
    typeof value === "string" ? value.length : `${value ?? ""}`.length;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-semibold text-[#2c2c2c]">
          {label}
          {optional ? (
            <span className="ml-1 text-xs font-normal text-[#6b6b6b]">
              (optional)
            </span>
          ) : null}
        </label>
        {auxiliary}
      </div>

      <textarea
        className={cn(
          "w-full rounded-[14px] border border-[#e5e5e5] bg-white px-3.5 py-3 text-sm text-[#2c2c2c] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#6b8e4e] focus:shadow-[0_0_0_4px_rgba(107,142,78,0.15)] placeholder:text-[#9c9c9c] resize-vertical",
          error ? "border-[#e57373] focus:shadow-[0_0_0_4px_rgba(229,115,115,0.25)]" : ""
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={hint ? `${props.id}-hint` : undefined}
        value={value}
        maxLength={maxLength}
        {...props}
      />

      <div className="flex items-center justify-between">
        {hint ? (
          <p id={`${props.id}-hint`} className="helper-text">
            {hint}
          </p>
        ) : (
          <span />
        )}
        {showCount ? (
          <p className="text-xs text-[#6b6b6b]">
            {currentLength}
            {maxLength ? ` / ${maxLength}` : " chars"}
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="error-text" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
