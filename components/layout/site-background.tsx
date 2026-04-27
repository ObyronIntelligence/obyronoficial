export function SiteBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      <div
        className="absolute -left-1/4 -top-1/4 h-[80vh] w-[80vh] rounded-full blur-[140px]"
        style={{ background: "radial-gradient(circle, hsl(var(--brand) / 0.28) 0%, transparent 70%)" }}
      />
      <div
        className="absolute right-[-20%] top-[15%] h-[90vh] w-[90vh] rounded-full blur-[160px]"
        style={{ background: "radial-gradient(circle, hsl(var(--brand-glow) / 0.22) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-[-25%] left-[10%] h-[70vh] w-[70vh] rounded-full blur-[140px]"
        style={{ background: "radial-gradient(circle, hsl(var(--brand) / 0.18) 0%, transparent 70%)" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.35)_100%)] dark:bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.45)_100%)]" />
    </div>
  );
}
