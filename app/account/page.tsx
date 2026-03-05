"use client"

import { useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, FileText, CreditCard, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const sidebarItems = [
  { id: "profile", label: "Profile", icon: User },
  { id: "analyses", label: "My Analyses", icon: FileText },
  { id: "billing", label: "Billing", icon: CreditCard, disabled: true },
]



export default function AccountPage() {
  const [activeSection, setActiveSection] = useState("profile")
  const [profile, setProfile] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
  })

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#fef3c7]/60 via-background to-[#dbeafe]/30" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />
      <Navbar />

      <main className="relative flex-1">
        <div className="mx-auto max-w-[1100px] px-6 py-10">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">My Account</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your profile and view your saved analyses.
            </p>
          </div>

          {/* Two-column layout */}
          <div className="flex flex-col gap-8 md:flex-row">
            {/* Sidebar */}
            <aside className="w-full shrink-0 md:w-56">
              <nav className="flex flex-row gap-1 md:flex-col">
                {sidebarItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => !item.disabled && setActiveSection(item.id)}
                      disabled={item.disabled}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors text-left",
                        activeSection === item.id
                          ? "bg-card text-foreground shadow-sm border border-border"
                          : item.disabled
                            ? "text-muted-foreground/40 cursor-not-allowed"
                            : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                      {item.disabled && (
                        <span className="ml-auto text-[10px] font-normal text-muted-foreground/40">Soon</span>
                      )}
                    </button>
                  )
                })}
              </nav>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {activeSection === "profile" && (
                <ProfileSection profile={profile} setProfile={setProfile} />
              )}
              {activeSection === "analyses" && <AnalysesSection />}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

/* ─── Profile Section ─── */

function ProfileSection({
  profile,
  setProfile,
}: {
  profile: { firstName: string; lastName: string; email: string }
  setProfile: (p: { firstName: string; lastName: string; email: string }) => void
}) {
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)

  const handleChangePassword = async () => {
    setPwError(null)
    setPwSuccess(false)

    if (!newPassword || !confirmPassword) {
      setPwError("Please fill in both fields.")
      return
    }
    if (newPassword.length < 6) {
      setPwError("Password must be at least 6 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.")
      return
    }

    setPwLoading(true)
    const supabase = createClient()
    if (!supabase) { setPwError("Authentication service unavailable."); setPwLoading(false); return }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwLoading(false)

    if (error) {
      setPwError(error.message)
    } else {
      setPwSuccess(true)
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => {
        setShowPasswordForm(false)
        setPwSuccess(false)
      }, 2000)
    }
  }

  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage your personal information.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                className="rounded-xl"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                className="rounded-xl"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              className="rounded-xl"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between border-t border-border pt-5">
            <Button
              variant="ghost"
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => {
                setShowPasswordForm(!showPasswordForm)
                setPwError(null)
                setPwSuccess(false)
                setNewPassword("")
                setConfirmPassword("")
              }}
            >
              {showPasswordForm ? "Cancel" : "Change password"}
            </Button>
            <Button className="rounded-xl bg-primary px-5 text-primary-foreground hover:bg-primary/90">
              Save changes
            </Button>
          </div>

          {showPasswordForm && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-xl border border-border bg-secondary/30 p-5">
              <h3 className="text-sm font-semibold text-foreground">Change password</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Enter a new password (minimum 6 characters).
              </p>

              <div className="mt-4 flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="newPassword" className="text-xs">New password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNew ? "text" : "password"}
                      className="rounded-xl pr-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showNew ? "Hide password" : "Show password"}
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirmNewPassword" className="text-xs">Confirm new password</Label>
                  <div className="relative">
                    <Input
                      id="confirmNewPassword"
                      type={showConfirm ? "text" : "password"}
                      className="rounded-xl pr-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {pwError && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-2.5 text-xs text-destructive">
                    {pwError}
                  </div>
                )}

                {pwSuccess && (
                  <div className="rounded-xl border border-[#16a34a]/20 bg-[#16a34a]/5 px-4 py-2.5 text-xs text-[#16a34a]">
                    Password updated successfully.
                  </div>
                )}

                <Button
                  className="mt-1 h-9 rounded-xl bg-foreground px-5 text-background hover:bg-foreground/90 text-sm"
                  onClick={handleChangePassword}
                  disabled={pwLoading}
                >
                  {pwLoading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
                  {pwLoading ? "Updating..." : "Update password"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Analyses Section ─── */

function AnalysesSection() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">My Analyses</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Your saved product analysis reports.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
          <FileText className="h-7 w-7 text-muted-foreground/40" />
        </div>
        <h3 className="mt-6 text-base font-semibold text-foreground">
          No analyses yet
        </h3>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground leading-relaxed">
          Run your first product analysis to see reports here.
        </p>
        <Button
          className="mt-8 h-10 rounded-xl bg-primary px-6 text-primary-foreground hover:bg-primary/90 font-medium"
          asChild
        >
          <Link href="/analyze">
            Start Analysis
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
