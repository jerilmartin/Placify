import { createFileRoute } from "@tanstack/react-router";
import { PortalStub } from "@/components/portal-stub";

export const Route = createFileRoute("/app/university/analytics")({
  component: () => (
    <PortalStub
      eyebrow="Placement Cell"
      title="Placement analytics"
      description="Branch-wise offers, median CTC trends, dream-company conversion, and diversity outcomes."
    />
  ),
});
