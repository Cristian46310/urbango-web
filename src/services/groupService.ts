import { httpMsMessages } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type {
  AddGroupMembersPayload,
  CreateGroupPayload,
  GroupPage,
  MessageGroup,
  UpdateGroupIconPayload,
} from "@/core/types/messaging";

export async function createGroup(payload: CreateGroupPayload): Promise<MessageGroup> {
  return httpMsMessages.post<MessageGroup>(ENDPOINTS.MESSAGES.GROUPS.BASE, payload);
}

export async function getGroups(page = 1, limit = 20): Promise<GroupPage> {
  return httpMsMessages.get<GroupPage>(ENDPOINTS.MESSAGES.GROUPS.BASE, {
    params: { page, limit },
  });
}

export async function joinGroup(groupId: string): Promise<MessageGroup> {
  return httpMsMessages.post<MessageGroup>(ENDPOINTS.MESSAGES.GROUPS.JOIN(groupId));
}

export async function addGroupMembers(
  groupId: string,
  payload: AddGroupMembersPayload,
): Promise<MessageGroup> {
  return httpMsMessages.post<MessageGroup>(
    ENDPOINTS.MESSAGES.GROUPS.MEMBERS(groupId),
    payload,
  );
}

export async function updateGroupIcon(
  groupId: string,
  payload: UpdateGroupIconPayload,
): Promise<MessageGroup> {
  return httpMsMessages.post<MessageGroup>(
    ENDPOINTS.MESSAGES.GROUPS.ICON(groupId),
    payload,
  );
}
