import { createFileRoute } from "@tanstack/react-router";
import { PortalStub } from "@/components/portal-stub";

export const Route = createFileRoute("/app/admin/users")({
  component: () => (
    <PortalStub
      eyebrow="Placify Cloud · Admin"
      title="Users"
      description="Cross-tenant user directory with impersonation trails, role assignments, and session controls."
    />
  ),
});
