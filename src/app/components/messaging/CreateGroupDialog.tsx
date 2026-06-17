import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Users } from "lucide-react";

import type { CreateGroupPayload, UserSearchResult } from "@/core/types/messaging";
import { MemberSearchPicker } from "./MemberSearchPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DialogField } from "@/app/components/security/dialog-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateGroupCurrentUser {
  id: string;
  email: string;
  name?: string;
}

interface CreateGroupDialogProps {
  open: boolean;
  loading: boolean;
  hasCitizenProfile: boolean | null;
  results: UserSearchResult[];
  currentUser?: CreateGroupCurrentUser;
  onOpenChange: (open: boolean) => void;
  onSearch: (query: string) => void;
  onCreate: (payload: CreateGroupPayload, iconUrl?: string) => Promise<boolean>;
}

function getCreatorDisplayName(user: CreateGroupCurrentUser): string {
  if (user.name?.trim()) return user.name.trim();
  const localPart = user.email.split("@")[0]?.trim();
  return localPart || "Tú";
}

export function CreateGroupDialog({
  open,
  loading,
  hasCitizenProfile,
  results,
  currentUser,
  onOpenChange,
  onSearch,
  onCreate,
}: CreateGroupDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [iconUrl, setIconUrl] = useState("");
  const [members, setMembers] = useState<UserSearchResult[]>([]);

  const reset = () => {
    setName("");
    setDescription("");
    setVisibility("public");
    setIconUrl("");
    setMembers([]);
  };

  const handleAddMember = (user: UserSearchResult) => {
    if (user.id === currentUser?.id) return;

    setMembers((prev) => {
      if (prev.some((member) => member.id === user.id)) return prev;
      return [...prev, user];
    });
  };

  const handleSubmit = async () => {
    const invitedMemberIds = members
      .filter((member) => member.id !== currentUser?.id)
      .map((member) => member.id);

    const created = await onCreate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        visibility,
        memberIds: invitedMemberIds,
      },
      iconUrl.trim() || undefined,
    );

    if (created) {
      reset();
      onOpenChange(false);
    }
  };

  const canSubmit =
    hasCitizenProfile === true &&
    Boolean(currentUser?.id) &&
    name.trim().length > 0 &&
    members.length >= 2 &&
    !loading;

  const creatorLabel = currentUser ? getCreatorDisplayName(currentUser) : "Tú";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Crear grupo
          </DialogTitle>
          <DialogDescription>
            HU-ENTR-3-006: organiza comunicación con personas que comparten intereses.
          </DialogDescription>
        </DialogHeader>

        {hasCitizenProfile === false ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">Necesitas perfil ciudadano</p>
            <p className="mt-1">
              Solo ciudadanos registrados pueden crear o gestionar grupos.
            </p>
            <Button asChild className="mt-3" size="sm">
              <Link to="/app/register-profile">Registrarme como ciudadano</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <DialogField label="Nombre del grupo" htmlFor="group-name">
              <Input
                id="group-name"
                value={name}
                onChange={(e) => { setName(e.target.value); }}
                placeholder="Ciclistas UC"
              />
            </DialogField>

            <DialogField label="Descripción" htmlFor="group-description">
              <Textarea
                id="group-description"
                value={description}
                onChange={(e) => { setDescription(e.target.value); }}
                rows={3}
                placeholder="Grupo de interés para ciclistas"
              />
            </DialogField>

            <DialogField label="Visibilidad" htmlFor="group-visibility">
              <Select
                value={visibility}
                onValueChange={(value) => {
                  setVisibility(value as "public" | "private");
                }}
              >
                <SelectTrigger id="group-visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Público (cualquiera puede unirse)</SelectItem>
                  <SelectItem value="private">Privado (solo por invitación)</SelectItem>
                </SelectContent>
              </Select>
            </DialogField>

            <DialogField label="Ícono (URL opcional)" htmlFor="group-icon">
              <Input
                id="group-icon"
                value={iconUrl}
                onChange={(e) => { setIconUrl(e.target.value); }}
                placeholder="https://cdn.example.com/icons/group.png"
              />
            </DialogField>

            {currentUser ? (
              <DialogField label="Administrador del grupo">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm">
                  <ShieldCheck className="size-4 text-primary" />
                  <span className="font-medium">{creatorLabel}</span>
                  <span className="text-muted-foreground">({currentUser.email})</span>
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    Tú
                  </span>
                </span>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ya estás incluido en el grupo. Solo necesitas invitar a otras personas.
                </p>
              </DialogField>
            ) : null}

            <MemberSearchPicker
              results={results}
              loading={loading}
              selectedMembers={members}
              currentUserId={currentUser?.id}
              minMembers={2}
              creatorIncluded={Boolean(currentUser)}
              onSearch={onSearch}
              onAdd={handleAddMember}
              onRemove={(userId) => {
                if (userId === currentUser?.id) return;
                setMembers((prev) => prev.filter((member) => member.id !== userId));
              }}
            />

            <Button
              type="button"
              className="w-full"
              disabled={!canSubmit}
              onClick={() => { void handleSubmit(); }}
            >
              Crear grupo
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
