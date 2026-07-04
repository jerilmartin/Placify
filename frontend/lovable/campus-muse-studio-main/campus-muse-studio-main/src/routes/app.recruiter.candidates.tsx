import { createFileRoute } from "@tanstack/react-router";
import { PortalStub } from "@/components/portal-stub";

export const Route = createFileRoute("/app/recruiter/candidates")({
  component: () => (
    <PortalStub
      eyebrow="Recruiter · Candidates"
      title="Candidate pipeline"
      description="Every applicant across your open roles, ranked by fit. Filter by CGPA, campus, skill signals, and interview stage."
    />
  ),
});
