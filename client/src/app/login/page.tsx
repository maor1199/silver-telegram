"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/navbar";
import LoginForm from "./LoginForm";

// הגדרה זו מונעת מה-Build לנסות לרנדר את הדף הזה כקובץ סטטי בזמן הבנייה
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-screen flex-col bg-background">
          <Navbar />
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}