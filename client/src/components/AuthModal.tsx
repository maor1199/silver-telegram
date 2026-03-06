import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  message?: string;
};

export function AuthModal({
  open,
  onClose,
  onSuccess,
  title = "Sign in to continue",
  message = "Sign in with your email to see the results.",
}: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const signInWithEmail = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    if (!supabase || !email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (err) {
      setError(err.message === "Invalid login credentials" ? "Invalid email or password." : err.message);
      return;
    }
    onSuccess?.();
  };

  const signUpWithEmail = async () => {
    if (!supabase || !email.trim() || !password) {
      setError("Please enter email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSuccess?.();
  };

  if (!open) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-900 shadow-2xl shadow-black/50">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id="auth-modal-title" className="text-xl font-semibold text-white">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-3 text-sm text-white/70 leading-relaxed">{message}</p>
          <form onSubmit={signInWithEmail} className="mt-6 flex flex-col gap-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-white/40 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-white/40 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
              autoComplete="current-password"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!supabase || loading}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Sign in
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); void signUpWithEmail(); }}
                disabled={!supabase || loading}
                className="flex-1 rounded-xl border border-white/20 px-4 py-3 font-medium text-white/90 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sign up
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-white/50 hover:text-white/80 transition"
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
