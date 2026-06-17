import { useState } from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";

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

interface CreateGroupDialogProps {
  open: boolean;
  loading: boolean;
  hasCitizenProfile: boolean | null;
  results: UserSearchResult[];
  currentUserId?: string;
  onOpenChange: (open: boolean) => void;
  onSearch: (query: string) => void;
  onCreate: (payload: CreateGroupPayload, iconUrl?: string) => Promise<boolean>;
}

export function CreateGroupDialog({
  open,
  loading,
  hasCitizenProfile,
  results,
  currentUserId,
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
    setMembers((prev) => {
      if (prev.some((member) => member.id === user.id)) return prev;
      return [...prev, user];
    });
  };

  const handleSubmit = async () => {
    const created = await onCreate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        visibility,
        memberIds: members.map((member) => member.id),
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
    name.trim().length > 0 &&
    members.length >= 2 &&
    !loading;

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

            <MemberSearchPicker
              results={results}
              loading={loading}
              selectedMembers={members}
              currentUserId={currentUserId}
              minMembers={2}
              onSearch={onSearch}
              onAdd={handleAddMember}
              onRemove={(userId) => {
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
