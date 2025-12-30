import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { registerAction } from "@/app/actions/auth";

interface RegisterPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function RegisterPage(props: RegisterPageProps) {
  // If already logged in, redirect to dashboard
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  const searchParams = await props.searchParams;
  const error = searchParams.error ? decodeURIComponent(searchParams.error) : null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Veervrat
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form action={registerAction} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         text-gray-900 placeholder-gray-400"
              placeholder="Your Name"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         text-gray-900 placeholder-gray-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         text-gray-900 placeholder-gray-400"
              placeholder="••••••••"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              minLength={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         text-gray-900 placeholder-gray-400"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Create Account
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-600 hover:underline font-medium"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
