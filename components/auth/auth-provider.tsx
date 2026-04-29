"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchProfileByUserId, type ClientProfile } from "@/lib/supabase/profiles";
import { cn } from "@/lib/utils";

type AuthModalState = {
  open: boolean;
  description: string;
  title: string;
};

type AuthContextValue = {
  closeAuthModal: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  openAuthModal: (options?: Partial<Omit<AuthModalState, "open">>) => void;
  profile: ClientProfile | null;
  profileLoading: boolean;
  requireAuth: (options?: Partial<Omit<AuthModalState, "open">>) => boolean;
  session: Session | null;
  signOut: () => Promise<void>;
  user: User | null;
};

const DEFAULT_MODAL_STATE: AuthModalState = {
  open: false,
  title: "Entre para continuar",
  description: "Crie sua conta ou faca login para liberar esta interacao no site.",
};

const AuthContext = createContext<AuthContextValue | null>(null);

function buildAuthHref(basePath: "/auth/signin" | "/auth/signup", nextPath: string) {
  return `${basePath}?next=${encodeURIComponent(nextPath || "/neural")}`;
}

function AuthRequiredModal({
  description,
  onClose,
  title,
}: {
  description: string;
  onClose: () => void;
  title: string;
}) {
  const pathname = usePathname();
  const nextPath = pathname || "/neural";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-background/82 px-4 backdrop-blur-md">
      <button
        type="button"
        aria-label="Fechar aviso de autenticacao"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <Card className="relative z-[1] w-full max-w-md border-border/60 bg-card/92 shadow-[0_30px_120px_hsl(var(--background)/0.55)]">
        <CardContent className="p-7">
          <p className="text-[11px] uppercase tracking-[0.22em] text-brand">Acesso restrito</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href={buildAuthHref("/auth/signin", nextPath)}
              className={buttonVariants({ variant: "outline", className: "w-full" })}
            >
              Entrar
            </Link>
            <Link
              href={buildAuthHref("/auth/signup", nextPath)}
              className={buttonVariants({
                className: "w-full bg-foreground text-background hover:bg-foreground/90",
              })}
            >
              Criar conta
            </Link>
          </div>

          <Button type="button" variant="ghost" className="mt-3 w-full" onClick={onClose}>
            Agora nao
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [modalState, setModalState] = useState<AuthModalState>(DEFAULT_MODAL_STATE);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    let isMounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setSession(data.session);
      setUser(data.session?.user || null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user || null);
      if (!nextSession?.user) {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;

    if (!user?.id) {
      setProfile(null);
      setProfileLoading(false);
      return () => {
        isMounted = false;
      };
    }

    setProfileLoading(true);

    void fetchProfileByUserId(supabase, user.id)
      .then((nextProfile) => {
        if (!isMounted) {
          return;
        }

        setProfile(nextProfile);
      })
      .catch((error) => {
        console.error("Falha ao carregar o profile do Supabase.", error);

        if (!isMounted) {
          return;
        }

        setProfile(null);
      })
      .finally(() => {
        if (!isMounted) {
          return;
        }

        setProfileLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [supabase, user?.id]);

  const openAuthModal = useCallback((options?: Partial<Omit<AuthModalState, "open">>) => {
    setModalState({
      open: true,
      title: options?.title || DEFAULT_MODAL_STATE.title,
      description: options?.description || DEFAULT_MODAL_STATE.description,
    });
  }, []);

  const closeAuthModal = useCallback(() => {
    setModalState((current) => ({ ...current, open: false }));
  }, []);

  const requireAuth = useCallback(
    (options?: Partial<Omit<AuthModalState, "open">>) => {
      if (user) {
        return true;
      }

      openAuthModal(options);
      return false;
    },
    [openAuthModal, user],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      closeAuthModal,
      isAuthenticated: Boolean(user),
      loading,
      openAuthModal,
      profile,
      profileLoading,
      requireAuth,
      session,
      signOut,
      user,
    }),
    [closeAuthModal, loading, openAuthModal, profile, profileLoading, requireAuth, session, signOut, user],
  );

  return (
    <AuthContext.Provider value={value}>
      <div className={cn(modalState.open && "pointer-events-none select-none blur-[1px]")}>{children}</div>
      {modalState.open ? (
        <AuthRequiredModal
          title={modalState.title}
          description={modalState.description}
          onClose={closeAuthModal}
        />
      ) : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth precisa estar dentro de AuthProvider.");
  }

  return context;
}
