import { createFileRoute } from "@tanstack/react-router";
import { PortalStub } from "@/components/portal-stub";

export const Route = createFileRoute("/app/recruiter/analytics")({
  component: () => (
    <PortalStub
      eyebrow="Recruiter · Analytics"
      title="Hiring analytics"
      description="Funnel conversion, cost per hire, time to offer, and campus-by-campus quality signals for this season."
    />
  ),
});
