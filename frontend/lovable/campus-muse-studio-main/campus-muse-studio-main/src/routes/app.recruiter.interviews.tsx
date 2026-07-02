import { createFileRoute } from "@tanstack/react-router";
import { PortalStub } from "@/components/portal-stub";

export const Route = createFileRoute("/app/recruiter/interviews")({
  component: () => (
    <PortalStub
      eyebrow="Recruiter · Interviews"
      title="Interview schedule"
      description="Panel calendars, room assignments, AI screening scores, and live feedback capture — all in one queue."
    />
  ),
});
