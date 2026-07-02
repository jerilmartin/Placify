import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { AppSidebar, type PortalRole } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";
import { CommandMenu } from "@/components/command-menu";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function resolveRole(pathname: string): PortalRole {
  if (pathname.startsWith("/app/recruiter")) return "recruiter";
  if (pathname.startsWith("/app/university")) return "university";
  if (pathname.startsWith("/app/admin")) return "admin";
  return "student";
}

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const role = resolveRole(pathname);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar
        role={role}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        onOpenCommand={() => setCmdOpen(true)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenCommand={() => setCmdOpen(true)} />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <CommandMenu role={role} open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  );
}
