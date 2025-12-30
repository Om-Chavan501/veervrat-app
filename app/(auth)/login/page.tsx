import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions/auth";

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage(props: LoginPageProps) {
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

        <form action={loginAction} className="space-y-4">
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
            Sign In
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-blue-600 hover:underline font-medium"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
