import { createFileRoute } from "@tanstack/react-router";
import { PortalStub } from "@/components/portal-stub";

export const Route = createFileRoute("/app/admin/keys")({
  component: () => (
    <PortalStub
      eyebrow="Placify Cloud · Admin"
      title="API keys"
      description="Issue, scope, and rotate credentials for the Placify public API and webhook signing keys."
    />
  ),
});
