import { createFileRoute } from "@tanstack/react-router";
import { PortalStub } from "@/components/portal-stub";

export const Route = createFileRoute("/app/admin/billing")({
  component: () => (
    <PortalStub
      eyebrow="Placify Cloud · Admin"
      title="Billing"
      description="Invoicing, MRR, dunning, and per-tenant usage — reconciled with the financial system of record."
    />
  ),
});
