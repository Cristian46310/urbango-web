import type { ReactNode } from "react";

import { CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PageShellProps {
  title: string;
  description: string;
  children: ReactNode;
  /** Optional eyebrow above the title. Omit to hide. */
  eyebrow?: string;
  /** Icon or element shown before the title. */
  titleIcon?: ReactNode;
  /** Larger title for primary action pages. */
  titleSize?: "default" | "lg";
}

export function PageShell({
  title,
  description,
  children,
  eyebrow,
  titleIcon,
  titleSize = "default",
}: PageShellProps) {
  return (
    <div className="bg-(--security-surface) px-6 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-(--security-border) bg-[#F8FAFB] px-6 py-5 shadow-sm">
          {eyebrow ? (
            <p className="text-xs uppercase tracking-[0.18em] text-(--security-muted-foreground)">
              {eyebrow}
            </p>
          ) : null}
          <div className={cn("flex flex-col gap-2", eyebrow ? "mt-1" : undefined)}>
            <CardTitle
              className={cn(
                "flex items-center gap-2.5 text-(--security-foreground)",
                titleSize === "lg" ? "text-3xl font-semibold tracking-tight" : "text-2xl",
              )}
            >
              {titleIcon}
              {title}
            </CardTitle>
            <CardDescription className="text-(--security-muted-foreground)">
              {description}
            </CardDescription>
          </div>
        </header>
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
