import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { AuthModal } from "../components/AuthModal";

type AuthContextValue = {
  user: User | null;
  isAuthConfigured: boolean;
  showAuthModal: (options?: { title?: string; message?: string }) => void;
  hideAuthModal: () => void;
  requireAuth: (action: () => void | Promise<void>, options?: { title?: string; message?: string }) => void | Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalOptions, setAuthModalOptions] = useState<{ title?: string; message?: string }>({});
  type PendingActionFn = () => void | Promise<void>;
  const [_pendingAction, setPendingAction] = useState<(() => PendingActionFn) | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setAuthModalOpen(false);
        setPendingAction((prev) => {
          if (prev) {
            const act = prev();
            act();
            return null;
          }
          return prev;
        });
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const showAuthModal = useCallback((options?: { title?: string; message?: string }) => {
    setAuthModalOptions(options ?? {});
    setAuthModalOpen(true);
  }, []);

  const hideAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    setPendingAction(null);
  }, []);

  const runPendingActionAndClose = useCallback(() => {
    setPendingAction((prev) => {
      if (prev) {
        const act = prev();
        act();
      }
      return null;
    });
    setAuthModalOpen(false);
  }, []);

  const requireAuth = useCallback(
    (action: () => void | Promise<void>, options?: { title?: string; message?: string }) => {
      if (user) {
        return action();
      }
      setPendingAction(() => action);
      showAuthModal(options);
    },
    [user, showAuthModal]
  );

  const value: AuthContextValue = { user, isAuthConfigured: Boolean(supabase), showAuthModal, hideAuthModal, requireAuth };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        open={authModalOpen}
        onClose={hideAuthModal}
        onSuccess={runPendingActionAndClose}
        title={authModalOptions.title ?? "Sign in to continue"}
        message={authModalOptions.message ?? "Sign in to see the results."}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
