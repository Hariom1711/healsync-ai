import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function TenantHome() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.needsOnboarding) {
    redirect("/onboarding")
  }

  if (session.user.role === "DOCTOR") {
    redirect("/doctor/dashboard")
  } else {
    redirect("/patient/dashboard")
  }
}
