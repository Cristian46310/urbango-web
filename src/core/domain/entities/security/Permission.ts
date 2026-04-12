export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface Permission {
  id: string;
  url: string;
  method: HttpMethod;
  relationId?: string;
}

export type CreatePermissionDTO = Omit<Permission, "id">;

export type UpdatePermissionDTO = Partial<CreatePermissionDTO>;
