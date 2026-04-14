import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";

interface DialogFieldProps {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}

export function DialogField({ label, htmlFor, children }: DialogFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
