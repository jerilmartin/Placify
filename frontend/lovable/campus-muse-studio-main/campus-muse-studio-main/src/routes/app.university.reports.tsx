import { createFileRoute } from "@tanstack/react-router";
import { PortalStub } from "@/components/portal-stub";

export const Route = createFileRoute("/app/university/reports")({
  component: () => (
    <PortalStub
      eyebrow="Placement Cell"
      title="Reports"
      description="Season closure reports, NAAC and NIRF exports, and board-ready placement summaries."
    />
  ),
});
