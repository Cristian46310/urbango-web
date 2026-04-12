import type { LucideIcon } from "lucide-react";
import { MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RowAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "destructive";
}

interface RowActionsDropdownProps {
  actions: RowAction[];
  buttonAriaLabel?: string;
}

export function RowActionsDropdown({ actions, buttonAriaLabel = "Opciones" }: RowActionsDropdownProps) {
  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={buttonAriaLabel}>
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <DropdownMenuItem
                key={action.label}
                variant={action.variant}
                onClick={action.onClick}
              >
                <Icon className="size-4" />
                {action.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
