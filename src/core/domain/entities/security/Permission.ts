export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface Permission {
  id: string;
  url: string;
  method: HttpMethod;
}

export type CreatePermissionDTO = Omit<Permission, "id">;

export type UpdatePermissionDTO = Partial<CreatePermissionDTO>;
