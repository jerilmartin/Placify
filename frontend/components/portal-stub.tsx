import { Construction } from "lucide-react";

export function PortalStub({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {eyebrow}
        </div>
        <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="flex min-h-[380px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 text-center shadow-sharp">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-secondary text-primary">
          <Construction className="h-5 w-5" />
        </div>
        <h3 className="font-serif text-lg font-bold text-foreground">Module in production preview</h3>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          Design, data model, and workflows are locked. Interactive views ship in
          the next sprint of this portal.
        </p>
      </div>
    </div>
  );
}
