import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PageShellProps {
  title: string;
  description: string;
  children: ReactNode;
  aside?: ReactNode;
}

export function PageShell({ title, description, children, aside }: PageShellProps) {
  return (
    <div className="bg-(--security-surface) px-6 py-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="border-(--security-border) bg-card shadow-sm">
          <CardHeader className="border-b border-(--security-border) bg-(--security-surface)">
            <CardTitle className="text-2xl text-(--security-foreground)">{title}</CardTitle>
            <CardDescription className="text-(--security-muted-foreground)">{description}</CardDescription>
          </CardHeader>
          <CardContent className="bg-card pt-6">{children}</CardContent>
        </Card>

        {aside ? (
          <Card className="border-(--security-border) bg-card shadow-sm">
            <CardHeader className="border-b border-(--security-border) bg-(--security-surface)">
              <CardTitle className="text-lg text-(--security-foreground)">Guía rápida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-(--security-muted-foreground)">{aside}</CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}