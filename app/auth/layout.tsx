import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center px-6 py-16">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground">
          <Sparkles className="h-4 w-4 text-background" />
        </div>
        <span className="text-lg font-bold tracking-tight">Obyron</span>
      </Link>
      {children}
    </div>
  );
}
