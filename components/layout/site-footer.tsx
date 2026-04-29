 "use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Github, Linkedin, Sparkles, Twitter } from "lucide-react";

const FOOTER_LINKS = {
  Produto: [
    { href: "/planos", label: "Planos" },
    { href: "/obyronai", label: "ObyronAI" },
  ],
  Empresa: [
    { href: "/sobre", label: "Sobre" },
    { href: "/contato", label: "Contato" },
  ],
  Conta: [
    { href: "/auth/signin", label: "Entrar" },
    { href: "/auth/signup", label: "Criar conta" },
  ],
};

export function SiteFooter() {
  const pathname = usePathname();
  const isNeural = pathname === "/neural";

  if (isNeural) {
    return (
      <footer className="relative border-t border-border/60 bg-background/55 backdrop-blur-xl">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-6 py-4 text-center text-xs text-muted-foreground md:flex-row md:text-left">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground">
              <Sparkles className="h-4 w-4 text-background" />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">Obyron</span>
          </Link>
          <p>Obyron Neural integrada ao ecossistema ObyronAI.</p>
          <p>&copy; {new Date().getFullYear()} Obyron.</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="relative border-t border-border/60 bg-background/60">
      <div className="container mx-auto px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground">
                <Sparkles className="h-4 w-4 text-background" />
              </div>
              <span className="text-base font-bold tracking-tight text-foreground">Obyron</span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              Sites, automacoes e IA sob medida para empresas que querem escalar com inteligencia.
            </p>
            <div className="flex gap-2">
              {[Github, Twitter, Linkedin].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, items]) => (
            <div key={title}>
              <h4 className="mb-3 text-sm font-semibold text-foreground">{title}</h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>&copy; {new Date().getFullYear()} Obyron. Todos os direitos reservados.</p>
          <p>Construido com automacoes + IA.</p>
        </div>
      </div>
    </footer>
  );
}
