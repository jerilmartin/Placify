import { createFileRoute } from "@tanstack/react-router";
import { PortalStub } from "@/components/portal-stub";

export const Route = createFileRoute("/app/admin/audit")({
  component: () => (
    <PortalStub
      eyebrow="Placify Cloud · Admin"
      title="Audit logs"
      description="Immutable trail of every privileged action across every tenant, retained for seven years."
    />
  ),
});
