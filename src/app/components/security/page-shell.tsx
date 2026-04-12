import type { ReactNode } from "react";

import { CardDescription, CardTitle } from "@/components/ui/card";

interface PageShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <div className="bg-(--security-surface) px-6 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-(--security-border) bg-card px-6 py-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.18em] text-(--security-muted-foreground)">Panel de seguridad</p>
          <div className="mt-1 flex flex-col gap-2">
            <CardTitle className="text-2xl text-(--security-foreground)">{title}</CardTitle>
            <CardDescription className="text-(--security-muted-foreground)">{description}</CardDescription>
          </div>
        </header>
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}