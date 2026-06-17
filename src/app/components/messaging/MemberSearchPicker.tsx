import { useEffect, useState } from "react";
import { Search, User, X } from "lucide-react";

import type { UserSearchResult } from "@/core/types/messaging";
import { Input } from "@/components/ui/input";
import { DialogField } from "@/app/components/security/dialog-field";

interface MemberSearchPickerProps {
  results: UserSearchResult[];
  loading: boolean;
  selectedMembers: UserSearchResult[];
  currentUserId?: string;
  minMembers?: number;
  creatorIncluded?: boolean;
  onSearch: (query: string) => void;
  onAdd: (user: UserSearchResult) => void;
  onRemove: (userId: string) => void;
}

export function MemberSearchPicker({
  results,
  loading,
  selectedMembers,
  currentUserId,
  minMembers = 2,
  creatorIncluded = false,
  onSearch,
  onAdd,
  onRemove,
}: MemberSearchPickerProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      onSearch(query);
    }, 350);
    return () => { window.clearTimeout(timeout); };
  }, [query, onSearch]);

  const selectedIds = new Set(selectedMembers.map((member) => member.id));

  return (
    <div className="space-y-4">
      <DialogField
        label={
          creatorIncluded
            ? `Invitar miembros (mínimo ${String(minMembers)})`
            : `Miembros iniciales (mínimo ${String(minMembers)})`
        }
        htmlFor="member-search"
      >
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="member-search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); }}
            placeholder="Buscar por nombre o correo..."
            className="pl-9"
          />
        </div>
      </DialogField>

      {selectedMembers.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedMembers.map((member) => (
            <span
              key={member.id}
              className="inline-flex items-center gap-1 rounded-full border bg-accent px-3 py-1 text-sm"
            >
              {member.name}
              <button
                type="button"
                aria-label={`Quitar ${member.name}`}
                onClick={() => { onRemove(member.id); }}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {creatorIncluded
            ? `Agrega al menos ${String(minMembers)} personas más. Ya estás incluido como administrador.`
            : `Agrega al menos ${String(minMembers)} personas. Tú serás administrador automáticamente.`}
        </p>
      )}

      {query.trim() ? (
        <div className="max-h-48 space-y-2 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Buscando...</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted-foreground">No se encontraron personas.</p>
          ) : (
            results
              .filter((user) => user.id !== currentUserId && !selectedIds.has(user.id))
              .map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                  onClick={() => { onAdd(user); }}
                >
                  <User className="size-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </button>
              ))
          )}
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        {selectedMembers.length}/{minMembers}{" "}
        {creatorIncluded ? "invitados seleccionados" : "miembros seleccionados"}
      </p>
    </div>
  );
}
