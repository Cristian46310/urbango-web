import { useEffect, useState } from "react";
import { Search, User } from "lucide-react";

import type { UserSearchResult } from "@/core/types/messaging";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogField } from "@/app/components/security/dialog-field";
import { Card, CardContent } from "@/components/ui/card";

interface UserSearchProps {
  results: UserSearchResult[];
  loading: boolean;
  selectedUser: UserSearchResult | null;
  onSearch: (query: string) => void;
  onSelect: (user: UserSearchResult) => void;
}

export function UserSearch({
  results,
  loading,
  selectedUser,
  onSearch,
  onSelect,
}: UserSearchProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      onSearch(query);
    }, 350);

    return () => { window.clearTimeout(timeout); };
  }, [query, onSearch]);

  return (
    <div className="space-y-4">
      <DialogField label="Buscar persona" htmlFor="user-search">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="user-search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); }}
            placeholder="Nombre o correo..."
            className="pl-9"
          />
        </div>
      </DialogField>

      {selectedUser ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-4">
            <User className="size-5 text-primary" />
            <div>
              <p className="font-medium">{selectedUser.name}</p>
              <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="ml-auto"
              onClick={() => { onSelect(selectedUser); }}
            >
              Cambiar
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!selectedUser && query.trim() ? (
        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">Buscando...</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted-foreground">No se encontraron personas.</p>
          ) : (
            results.map((user) => (
              <button
                key={user.id}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                onClick={() => { onSelect(user); }}
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
    </div>
  );
}
