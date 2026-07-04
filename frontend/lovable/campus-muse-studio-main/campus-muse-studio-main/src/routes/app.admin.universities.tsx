import { createFileRoute } from "@tanstack/react-router";
import { PortalStub } from "@/components/portal-stub";

export const Route = createFileRoute("/app/admin/universities")({
  component: () => (
    <PortalStub
      eyebrow="Placify Cloud · Admin"
      title="Universities"
      description="Every tenant on Placify — plan, seat count, region, and health signals."
    />
  ),
});
