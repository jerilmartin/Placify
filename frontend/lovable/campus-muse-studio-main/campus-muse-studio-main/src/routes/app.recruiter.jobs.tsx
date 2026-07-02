import { createFileRoute } from "@tanstack/react-router";
import { PortalStub } from "@/components/portal-stub";

export const Route = createFileRoute("/app/recruiter/jobs")({
  component: () => (
    <PortalStub
      eyebrow="Recruiter · Jobs"
      title="Open roles"
      description="Draft, publish, and prioritize requisitions across campuses. Approvals, JD versioning, and slot allocation live here."
    />
  ),
});
