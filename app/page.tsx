import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Home() {
  // If logged in, go to dashboard; otherwise go to login
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
