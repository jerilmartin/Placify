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
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
          {eyebrow}
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-[28px]">
          {title}
        </h1>
        <p className="mt-1.5 max-w-xl text-[13.5px] text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="flex min-h-[380px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/60 px-6 text-center">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-elevated text-muted-foreground">
          <Construction className="h-5 w-5" />
        </div>
        <h3 className="text-[15px] font-medium">Module in production preview</h3>
        <p className="mt-1.5 max-w-sm text-[13px] text-muted-foreground">
          Design, data model, and workflows are locked. Interactive views ship in
          the next sprint of this portal.
        </p>
      </div>
    </div>
  );
}
