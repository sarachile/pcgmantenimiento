
import { redirect } from "next/navigation";

export default function HomePage() {
  // Simple redirection to dashboard as we don't have auth implemented yet
  redirect("/dashboard");
}
