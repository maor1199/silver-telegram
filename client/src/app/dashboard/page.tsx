import { redirect } from "next/navigation"

// The dashboard was replaced by the account page — redirect permanently.
export default function DashboardPage() {
  redirect("/account")
}
