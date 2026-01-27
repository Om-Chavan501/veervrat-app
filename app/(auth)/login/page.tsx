import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage(props: LoginPageProps) {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  const searchParams = await props.searchParams;
  const error = searchParams.error ? decodeURIComponent(searchParams.error) : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_20%_20%,#fff7ed,transparent_25%),radial-gradient(circle_at_80%_0%,#eaf0e2,transparent_28%),radial-gradient(circle_at_50%_80%,#f7ede4,transparent_32%)] px-4">
      <div className="w-full max-w-md rounded-[20px] border border-[#e5e5e5] bg-white p-8 shadow-soft">
        <div className="mb-6 space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#6b8e4e] to-[#c47b5c] text-white shadow-soft">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12a7 7 0 0 1 7-7 7 7 0 0 1 7 7c0 4-7 9-7 9s-7-5-7-9Z" />
              <path d="M12 9v3l2 2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#2c2c2c]">Veervrat</h1>
          <p className="text-sm text-[#6b6b6b]">Slow, clear steps toward inner strength</p>
        </div>

        <LoginForm error={error} />

        <p className="mt-6 text-center text-sm text-[#6b6b6b]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-[#6b8e4e] hover:text-[#56723f]">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
