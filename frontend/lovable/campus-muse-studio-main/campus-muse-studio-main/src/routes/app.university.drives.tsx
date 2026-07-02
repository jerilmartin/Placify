import { createFileRoute } from "@tanstack/react-router";
import { PortalStub } from "@/components/portal-stub";

export const Route = createFileRoute("/app/university/drives")({
  component: () => (
    <PortalStub
      eyebrow="Placement Cell"
      title="Placement drives"
      description="Schedule, approve, and monitor every recruiter drive of the season with real-time RSVPs and slot health."
    />
  ),
});
