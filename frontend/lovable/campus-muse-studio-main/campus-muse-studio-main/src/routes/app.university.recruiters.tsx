import { createFileRoute } from "@tanstack/react-router";
import { PortalStub } from "@/components/portal-stub";

export const Route = createFileRoute("/app/university/recruiters")({
  component: () => (
    <PortalStub
      eyebrow="Placement Cell"
      title="Recruiters"
      description="Every recruiter engaged this season — MoUs, historical hiring patterns, and preferred branches."
    />
  ),
});
