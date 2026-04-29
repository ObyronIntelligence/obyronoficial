"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Moon, Sparkles, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Inicio" },
  { href: "/planos", label: "Planos" },
  { href: "/obyronai", label: "ObyronAI" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = window.localStorage.getItem("obyron-theme");
    const nextTheme = saved === "light" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    setTheme(nextTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    window.localStorage.setItem("obyron-theme", nextTheme);
    setTheme(nextTheme);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto grid h-16 grid-cols-[1fr_auto] items-center gap-4 px-6 md:grid-cols-[1fr_auto_1fr]">
        <Link href="/" className="flex items-center gap-2 justify-self-start">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground">
            <Sparkles className="h-4 w-4 text-background" />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">Obyron</span>
        </Link>

        <nav className="hidden items-center gap-1 justify-self-center md:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  active ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 justify-self-end md:flex">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Alternar tema"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link href="/auth/signin" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Entrar
          </Link>
          <Link
            href="/auth/signup"
            className={buttonVariants({
              size: "sm",
              className: "bg-foreground text-background hover:bg-foreground/90",
            })}
          >
            Criar conta
          </Link>
        </div>

        <div className="flex items-center gap-1 justify-self-end md:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Alternar tema"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label="Abrir menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background/95 backdrop-blur md:hidden">
          <div className="container mx-auto flex flex-col gap-1 px-6 py-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              <Link
                href="/auth/signin"
                onClick={() => setOpen(false)}
                className={buttonVariants({ variant: "outline", size: "sm", className: "flex-1" })}
              >
                Entrar
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setOpen(false)}
                className={buttonVariants({
                  size: "sm",
                  className: "flex-1 bg-foreground text-background hover:bg-foreground/90",
                })}
              >
                Criar conta
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
