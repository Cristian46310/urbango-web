import type { UserSearchResult } from "@/core/types/messaging";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserSearch } from "./UserSearch";

interface NewChatDialogProps {
  open: boolean;
  results: UserSearchResult[];
  loading: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (query: string) => void;
  onSelectUser: (user: UserSearchResult) => void;
}

export function NewChatDialog({
  open,
  results,
  loading,
  onOpenChange,
  onSearch,
  onSelectUser,
}: NewChatDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo chat</DialogTitle>
          <DialogDescription>
            Busca una persona para iniciar una conversación directa.
          </DialogDescription>
        </DialogHeader>

        <UserSearch
          results={results}
          loading={loading}
          selectedUser={null}
          onSearch={onSearch}
          onSelect={(user) => {
            onSelectUser(user);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
