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
    <div className="bg-slate-50 px-6 py-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200/80 bg-white">
            <CardTitle className="text-2xl text-slate-900">{title}</CardTitle>
            <CardDescription className="text-slate-600">{description}</CardDescription>
          </CardHeader>
          <CardContent className="bg-white pt-6">{children}</CardContent>
        </Card>

        {aside ? (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">Guía rápida</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">{aside}</CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}