import { useState } from "react";
import { Globe, Lock, UserPlus } from "lucide-react";

import type {
  GroupMemberDetail,
  GroupMemberRole,
  MembershipLogEntry,
  MessageGroup,
  UserSearchResult,
} from "@/core/types/messaging";
import { GroupMembersAdminTab } from "./GroupMembersAdminTab";
import { GroupMembershipLogTab } from "./GroupMembershipLogTab";
import { MemberSearchPicker } from "./MemberSearchPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DialogField } from "@/app/components/security/dialog-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GroupPanelProps {
  group: MessageGroup;
  memberCount?: number;
  currentUserId?: string;
  myRole?: GroupMemberRole;
  isAdmin: boolean;
  isMember: boolean;
  loading: boolean;
  hasCitizenProfile: boolean | null;
  searchResults: UserSearchResult[];
  members: GroupMemberDetail[];
  membersLoading: boolean;
  membershipLog: MembershipLogEntry[];
  membershipLogLoading: boolean;
  onJoin: () => Promise<void>;
  onInvite: (memberIds: string[]) => Promise<void>;
  onUpdateIcon: (iconUrl: string) => Promise<void>;
  onSearch: (query: string) => void;
  onLoadMembers: (groupId: string, q?: string) => Promise<GroupMemberDetail[]>;
  onPromoteMember: (groupId: string, userId: string) => Promise<boolean>;
  onDemoteMember: (groupId: string, userId: string) => Promise<boolean>;
  onRemoveMember: (groupId: string, userId: string, block?: boolean) => Promise<boolean>;
  onLoadMembershipLog: (groupId: string) => Promise<MembershipLogEntry[]>;
}

function GroupInfoTab({
  group,
  memberCount,
  currentUserId,
  isAdmin,
  isMember,
  loading,
  hasCitizenProfile,
  searchResults,
  onJoin,
  onInvite,
  onUpdateIcon,
  onSearch,
}: Pick<
  GroupPanelProps,
  | "group"
  | "memberCount"
  | "currentUserId"
  | "isAdmin"
  | "isMember"
  | "loading"
  | "hasCitizenProfile"
  | "searchResults"
  | "onJoin"
  | "onInvite"
  | "onUpdateIcon"
  | "onSearch"
>) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [iconUrl, setIconUrl] = useState(group.iconUrl ?? "");
  const [inviteMembers, setInviteMembers] = useState<UserSearchResult[]>([]);

  const canManage = hasCitizenProfile === true && isAdmin;

  return (
    <>
      <div className="mx-auto w-full max-w-md space-y-6 text-center">
        {group.iconUrl ? (
          <img
            src={group.iconUrl}
            alt={group.name}
            className="mx-auto size-20 rounded-full border object-cover"
          />
        ) : (
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
            {group.name.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div>
          <h3 className="text-xl font-semibold">{group.name}</h3>
          {group.description ? (
            <p className="mt-2 text-sm text-muted-foreground">{group.description}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          {group.visibility === "public" ? (
            <>
              <Globe className="size-4" />
              Grupo público
            </>
          ) : (
            <>
              <Lock className="size-4" />
              Grupo privado
            </>
          )}
          <span>·</span>
          <span>{memberCount} miembros</span>
        </div>

        {!isMember && group.visibility === "public" ? (
          <Button
            type="button"
            disabled={loading || hasCitizenProfile === false}
            onClick={() => { void onJoin(); }}
          >
            Unirse al grupo
          </Button>
        ) : null}

        {hasCitizenProfile === false && (canManage || !isMember) ? (
          <p className="text-sm text-amber-600">
            Regístrate como ciudadano para gestionar grupos.
          </p>
        ) : null}

        {canManage ? (
          <div className="space-y-4 rounded-lg border bg-card p-4 text-left">
            <p className="text-sm font-medium">Administración del grupo</p>

            <DialogField label="Ícono del grupo (URL)" htmlFor="admin-group-icon">
              <div className="flex gap-2">
                <Input
                  id="admin-group-icon"
                  value={iconUrl}
                  onChange={(e) => { setIconUrl(e.target.value); }}
                  placeholder="https://..."
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading || !iconUrl.trim()}
                  onClick={() => { void onUpdateIcon(iconUrl.trim()); }}
                >
                  Guardar
                </Button>
              </div>
            </DialogField>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => { setInviteOpen(true); }}
            >
              <UserPlus className="size-4" />
              Agregar miembros
            </Button>
          </div>
        ) : null}
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar miembros</DialogTitle>
            <DialogDescription>
              Invita personas al grupo. Recibirán notificación en tiempo real.
            </DialogDescription>
          </DialogHeader>

          <MemberSearchPicker
            results={searchResults}
            loading={loading}
            selectedMembers={inviteMembers}
            currentUserId={currentUserId}
            minMembers={1}
            onSearch={onSearch}
            onAdd={(user) => {
              setInviteMembers((prev) => {
                if (prev.some((member) => member.id === user.id)) return prev;
                return [...prev, user];
              });
            }}
            onRemove={(userId) => {
              setInviteMembers((prev) => prev.filter((member) => member.id !== userId));
            }}
          />

          <Button
            type="button"
            className="w-full"
            disabled={loading || inviteMembers.length === 0}
            onClick={() => {
              void onInvite(inviteMembers.map((member) => member.id)).then(() => {
                setInviteMembers([]);
                setInviteOpen(false);
              });
            }}
          >
            Invitar seleccionados
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function GroupPanel({
  group,
  memberCount: memberCountProp,
  currentUserId,
  myRole,
  isAdmin,
  isMember,
  loading,
  hasCitizenProfile,
  searchResults,
  members,
  membersLoading,
  membershipLog,
  membershipLogLoading,
  onJoin,
  onInvite,
  onUpdateIcon,
  onSearch,
  onLoadMembers,
  onPromoteMember,
  onDemoteMember,
  onRemoveMember,
  onLoadMembershipLog,
}: GroupPanelProps) {
  const memberCount = memberCountProp ?? group.memberCount ?? group.members?.length ?? 0;
  const showAdminTabs = myRole === "admin" || isAdmin;

  return (
    <div className="flex h-full flex-col bg-(--security-surface) p-2">
      <Tabs defaultValue="info" className="w-full">
        <TabsList className={`grid w-full ${showAdminTabs ? "grid-cols-3" : "grid-cols-1"}`}>
          <TabsTrigger value="info">Info</TabsTrigger>
          {showAdminTabs ? (
            <>
              <TabsTrigger value="members">Miembros</TabsTrigger>
              <TabsTrigger value="activity">Actividad</TabsTrigger>
            </>
          ) : null}
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <GroupInfoTab
            group={group}
            memberCount={memberCount}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            isMember={isMember}
            loading={loading}
            hasCitizenProfile={hasCitizenProfile}
            searchResults={searchResults}
            onJoin={onJoin}
            onInvite={onInvite}
            onUpdateIcon={onUpdateIcon}
            onSearch={onSearch}
          />
        </TabsContent>

        {showAdminTabs ? (
          <>
            <TabsContent value="members" className="mt-4">
              <GroupMembersAdminTab
                groupId={group.id}
                currentUserId={currentUserId}
                members={members}
                loading={membersLoading || loading}
                onLoadMembers={onLoadMembers}
                onPromote={onPromoteMember}
                onDemote={onDemoteMember}
                onRemove={onRemoveMember}
              />
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <GroupMembershipLogTab
                groupId={group.id}
                entries={membershipLog}
                loading={membershipLogLoading}
                onLoadLog={onLoadMembershipLog}
              />
            </TabsContent>
          </>
        ) : null}
      </Tabs>
    </div>
  );
}
