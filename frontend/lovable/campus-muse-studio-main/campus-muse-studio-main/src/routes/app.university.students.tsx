import { createFileRoute } from "@tanstack/react-router";
import { PortalStub } from "@/components/portal-stub";

export const Route = createFileRoute("/app/university/students")({
  component: () => (
    <PortalStub
      eyebrow="Placement Cell"
      title="Students"
      description="Cohort roster, eligibility flags, per-student placement status, and one-click communication."
    />
  ),
});
