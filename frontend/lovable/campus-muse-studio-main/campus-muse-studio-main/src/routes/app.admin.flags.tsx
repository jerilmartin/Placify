import { createFileRoute } from "@tanstack/react-router";
import { PortalStub } from "@/components/portal-stub";

export const Route = createFileRoute("/app/admin/flags")({
  component: () => (
    <PortalStub
      eyebrow="Placify Cloud · Admin"
      title="Feature flags"
      description="Progressive rollouts, per-tenant targeting rules, and kill switches for AI models."
    />
  ),
});
