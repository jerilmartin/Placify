import { createFileRoute } from "@tanstack/react-router";
import { PortalStub } from "@/components/portal-stub";

export const Route = createFileRoute("/app/recruiter/settings")({
  component: () => (
    <PortalStub
      eyebrow="Recruiter"
      title="Settings"
      description="Team access, hiring approval matrix, notification preferences, and integrations."
    />
  ),
});
