import { createFileRoute } from "@tanstack/react-router";
import { PortalStub } from "@/components/portal-stub";

export const Route = createFileRoute("/app/recruiter/company")({
  component: () => (
    <PortalStub
      eyebrow="Recruiter"
      title="Company profile"
      description="How your brand appears to students — mission, tech stack, benefits, and past cohort outcomes."
    />
  ),
});
