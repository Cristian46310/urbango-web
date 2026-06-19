import { ArrowLeft, Globe, Search, Users } from "lucide-react";

import type { GroupDetail, MessageGroup } from "@/core/types/messaging";
import { usePublicGroups } from "@/hooks/messaging/usePublicGroups";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PublicGroupsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  hasCitizenProfile: boolean | null;
  onJoin: (groupId: string) => Promise<MessageGroup | null>;
  onOpenChat: (group: MessageGroup) => void;
}

function GroupAvatar({ group }: { group: Pick<MessageGroup, "name" | "iconUrl"> }) {
  if (group.iconUrl) {
    return (
      <img
        src={group.iconUrl}
        alt={group.name}
        className="size-12 shrink-0 rounded-full border object-cover"
      />
    );
  }

  return (
    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {group.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function GroupDetailView({
  detail,
  detailLoading,
  loading,
  hasCitizenProfile,
  onBack,
  onJoin,
  onOpenChat,
}: {
  detail: GroupDetail;
  detailLoading: boolean;
  loading: boolean;
  hasCitizenProfile: boolean | null;
  onBack: () => void;
  onJoin: () => Promise<void>;
  onOpenChat: () => void;
}) {
  const memberCount = detail.memberCount ?? detail.members?.length ?? 0;

  return (
    <div className="space-y-4">
      <Button type="button" variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="size-4" />
        Volver al directorio
      </Button>

      <div className="flex flex-col items-center gap-4 text-center">
        <GroupAvatar group={detail} />
        <div>
          <h3 className="text-xl font-semibold">{detail.name}</h3>
          {detail.description ? (
            <p className="mt-2 text-sm text-muted-foreground">{detail.description}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="size-4" />
          Grupo público
          <span>·</span>
          <Users className="size-4" />
          {memberCount} miembros
        </div>

        {detailLoading ? (
          <p className="text-sm text-muted-foreground">Cargando detalle...</p>
        ) : detail.isMember ? (
          <Button type="button" className="w-full max-w-xs" onClick={onOpenChat}>
            Abrir chat
          </Button>
        ) : (
          <>
            <Button
              type="button"
              className="w-full max-w-xs"
              disabled={loading || hasCitizenProfile === false}
              onClick={() => { void onJoin(); }}
            >
              {loading ? "Uniéndose..." : "Unirse al grupo"}
            </Button>
            {hasCitizenProfile === false ? (
              <p className="text-sm text-amber-600">
                Regístrate como ciudadano para unirte a grupos públicos.
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export function PublicGroupsDialog({
  open,
  onOpenChange,
  loading,
  hasCitizenProfile,
  onJoin,
  onOpenChat,
}: PublicGroupsDialogProps) {
  const {
    groups,
    selectedDetail,
    loading: searchLoading,
    detailLoading,
    error,
    query,
    setQuery,
    loadGroupDetail,
    clearSelection,
    reset,
  } = usePublicGroups();

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  };

  const handleJoin = async () => {
    if (!selectedDetail) return;
    const group = await onJoin(selectedDetail.id);
    if (group) {
      handleOpenChange(false);
      onOpenChat(group);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Explorar grupos públicos</DialogTitle>
          <DialogDescription>
            Busca grupos abiertos y únete para ver el chat en tiempo real.
          </DialogDescription>
        </DialogHeader>

        {selectedDetail ? (
          <GroupDetailView
            detail={selectedDetail}
            detailLoading={detailLoading}
            loading={loading}
            hasCitizenProfile={hasCitizenProfile}
            onBack={clearSelection}
            onJoin={handleJoin}
            onOpenChat={() => {
              handleOpenChange(false);
              onOpenChat(selectedDetail);
            }}
          />
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value); }}
                placeholder="Buscar por nombre o descripción..."
                className="pl-9"
              />
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <ScrollArea className="h-[420px] pr-3">
              {searchLoading ? (
                <p className="text-sm text-muted-foreground">Buscando grupos...</p>
              ) : groups.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay grupos públicos que coincidan con tu búsqueda.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {groups.map((group) => (
                    <Card
                      key={group.id}
                      className="cursor-pointer transition-colors hover:border-primary/40"
                      onClick={() => { void loadGroupDetail(group.id); }}
                    >
                      <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
                        <GroupAvatar group={group} />
                        <div className="min-w-0 flex-1">
                          <CardTitle className="truncate text-base">{group.name}</CardTitle>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {group.memberCount ?? group.members?.length ?? 0} miembros
                          </p>
                        </div>
                      </CardHeader>
                      {group.description ? (
                        <CardContent className="pt-0">
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {group.description}
                          </p>
                        </CardContent>
                      ) : null}
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
