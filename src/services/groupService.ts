import { httpMsMessages } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type {
  AddGroupMembersPayload,
  CreateGroupPayload,
  GroupDetail,
  GroupMemberPage,
  GroupMemberRole,
  GroupPage,
  JoinGroupResponse,
  MembershipLogPage,
  Message,
  MessagePage,
  MessageGroup,
  MessageReadEntry,
  MessageReadsResponse,
  SendGroupMessagePayload,
  UpdateGroupIconPayload,
  UpdateGroupMemberRolePayload,
} from "@/core/types/messaging";

export async function createGroup(payload: CreateGroupPayload): Promise<MessageGroup> {
  return httpMsMessages.post<MessageGroup>(ENDPOINTS.MESSAGES.GROUPS.BASE, payload);
}

export async function getGroups(page = 1, limit = 20): Promise<GroupPage> {
  return httpMsMessages.get<GroupPage>(ENDPOINTS.MESSAGES.GROUPS.BASE, {
    params: { page, limit },
  });
}

export async function getMyDriverGroups(page = 1, limit = 20): Promise<GroupPage> {
  return httpMsMessages.get<GroupPage>(ENDPOINTS.MESSAGES.GROUPS.ME, {
    params: { page, limit },
  });
}

export async function getGroupMessages(
  groupId: string,
  page = 1,
  limit = 50,
): Promise<MessagePage> {
  return httpMsMessages.get<MessagePage>(ENDPOINTS.MESSAGES.GROUPS.MESSAGES(groupId), {
    params: { page, limit },
  });
}

export async function sendGroupMessage(payload: SendGroupMessagePayload): Promise<Message[]> {
  const response = await httpMsMessages.post<Message | Message[]>(
    ENDPOINTS.MESSAGES.GROUP_MESSAGE,
    payload,
  );
  return Array.isArray(response) ? response : [response];
}

type RawMessageReadsResponse = MessageReadsResponse & {
  reads?: MessageReadEntry[];
};

export async function getMessageReads(messageId: string): Promise<MessageReadsResponse> {
  const response = await httpMsMessages.get<RawMessageReadsResponse>(
    ENDPOINTS.MESSAGES.MESSAGE_READS(messageId),
  );

  return {
    ...response,
    readBy: response.readBy ?? response.reads ?? [],
  };
}

export async function deleteGroupMessage(messageId: string): Promise<void> {
  await httpMsMessages.delete<void>(ENDPOINTS.MESSAGES.DELETE_MESSAGE(messageId));
}

export async function getPublicGroups(
  q?: string,
  page = 1,
  limit = 20,
): Promise<GroupPage> {
  return httpMsMessages.get<GroupPage>(ENDPOINTS.MESSAGES.GROUPS.PUBLIC, {
    params: { q: q?.trim() || undefined, page, limit },
  });
}

export async function getGroupById(groupId: string): Promise<GroupDetail> {
  return httpMsMessages.get<GroupDetail>(ENDPOINTS.MESSAGES.GROUPS.BY_ID(groupId));
}

export async function getGroupMembers(
  groupId: string,
  q?: string,
  page = 1,
  limit = 50,
): Promise<GroupMemberPage> {
  return httpMsMessages.get<GroupMemberPage>(ENDPOINTS.MESSAGES.GROUPS.MEMBERS(groupId), {
    params: { q: q?.trim() || undefined, page, limit },
  });
}

export async function updateGroupMemberRole(
  groupId: string,
  userId: string,
  role: GroupMemberRole,
): Promise<void> {
  const payload: UpdateGroupMemberRolePayload = { role };
  await httpMsMessages.patch<void>(
    ENDPOINTS.MESSAGES.GROUPS.MEMBER_ROLE(groupId, userId),
    payload,
  );
}

export async function removeGroupMember(
  groupId: string,
  userId: string,
  block = false,
): Promise<void> {
  await httpMsMessages.delete<void>(
    ENDPOINTS.MESSAGES.GROUPS.MEMBER_BY_ID(groupId, userId),
    { params: block ? { block: true } : undefined },
  );
}

export async function getGroupMembershipLog(
  groupId: string,
  page = 1,
  limit = 50,
): Promise<MembershipLogPage> {
  return httpMsMessages.get<MembershipLogPage>(
    ENDPOINTS.MESSAGES.GROUPS.MEMBERSHIP_LOG(groupId),
    { params: { page, limit } },
  );
}

export async function joinGroup(groupId: string): Promise<JoinGroupResponse> {
  return httpMsMessages.post<JoinGroupResponse>(ENDPOINTS.MESSAGES.GROUPS.JOIN(groupId));
}

export async function leaveGroup(groupId: string): Promise<void> {
  await httpMsMessages.post<void>(ENDPOINTS.MESSAGES.GROUPS.LEAVE(groupId));
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
