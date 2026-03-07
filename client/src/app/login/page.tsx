"use client";

import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/navbar";
import LoginForm from "./LoginForm";

// זה מונע מ-Next.js לנסות להפוך את הדף הזה לסטטי
export const dynamic = "force-dynamic";

export default function LoginPage() {
  // נוסיף בדיקה פשוטה כדי לוודא שזה רץ רק בדפדפן
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // או להחזיר את ה-Loader שלך כאן
  }

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