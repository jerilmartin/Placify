import { createFileRoute } from "@tanstack/react-router";
import { PortalStub } from "@/components/portal-stub";

export const Route = createFileRoute("/app/university/settings")({
  component: () => (
    <PortalStub
      eyebrow="Placement Cell"
      title="Settings"
      description="Cell members, approval workflows, branding, and academic calendar integration."
    />
  ),
});
