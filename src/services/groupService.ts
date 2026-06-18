import { httpMsMessages } from "@/infra/api/builderHttp";
import { ENDPOINTS } from "@/infra/api/endpoints";
import type {
  AddGroupMembersPayload,
  CreateGroupPayload,
  GroupPage,
  Message,
  MessagePage,
  MessageGroup,
  MessageReadEntry,
  MessageReadsResponse,
  SendGroupMessagePayload,
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

export async function joinGroup(groupId: string): Promise<MessageGroup> {
  return httpMsMessages.post<MessageGroup>(ENDPOINTS.MESSAGES.GROUPS.JOIN(groupId));
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
