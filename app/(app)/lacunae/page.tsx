import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { startShortlistSessionAction } from "@/app/actions/shortlist";

export default async function LacunaeSelectionPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        Start a New Assessment
      </h2>
      <p className="text-gray-600 mb-8">
        Begin by selecting which internal weaknesses you want to work on. You can choose from our lacunae across three categories.
      </p>

      <form
        action={startShortlistSessionAction}
        className="max-w-md"
      >
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Begin Assessment Journey
          </h3>
          <p className="text-gray-700 mb-6">
            You'll start by shortlisting the lacunae (internal weaknesses) you want to work on. We have three categories of lacunae to help organize your growth journey.
          </p>
          
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 font-bold mt-1">A</span>
              <div>
                <p className="font-semibold text-gray-900">Category A</p>
                <p className="text-sm text-gray-600">First set of lacunae</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-600 font-bold mt-1">B</span>
              <div>
                <p className="font-semibold text-gray-900">Category B</p>
                <p className="text-sm text-gray-600">Second set of lacunae</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-600 font-bold mt-1">C</span>
              <div>
                <p className="font-semibold text-gray-900">Category C</p>
                <p className="text-sm text-gray-600">Third set of lacunae</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            Start Shortlisting →
          </button>
        </div>
      </form>
    </div>
  );
}
