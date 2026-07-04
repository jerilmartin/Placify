import { createFileRoute } from "@tanstack/react-router";
import { PortalStub } from "@/components/portal-stub";

export const Route = createFileRoute("/app/admin/settings")({
  component: () => (
    <PortalStub
      eyebrow="Placify Cloud · Admin"
      title="Settings"
      description="Platform-wide defaults, security policy, incident tooling, and staff access."
    />
  ),
});
