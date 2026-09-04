import { ENDPOINTS } from "@/infra/api/endpoints";
import type {
  CreatePqrsImageRequest,
  CreatePqrsInput,
  CreatePqrsUpdateRequest,
  ListPqrsQuery,
  Pqrs,
  PqrsUpdate,
  UpdatePqrsRequest,
} from "@/core/types/pqrs";

/**
 * Base URL de ms-ai para PQRS (endpoint abierto, sin JWT).
 * Preferir VITE_MS_AI_URL; fallback a VITE_URL_MS_AI por compatibilidad.
 */
function getMsAiBaseUrl(): string {
  const url =
    (import.meta.env.VITE_MS_AI_URL as string | undefined) ||
    (import.meta.env.VITE_URL_MS_AI as string | undefined) ||
    "";
  return url.replace(/\/$/, "");
}

function pqrsUrl(path: string, query?: Record<string, string | undefined>): string {
  const base = getMsAiBaseUrl();
  if (!base) {
    throw new Error("VITE_MS_AI_URL no está configurada");
  }
  const url = new URL(`${base}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value != null && value !== "") {
        url.searchParams.set(key, value);
      }
    }
  }
  return url.toString();
}

function extractErrorDetail(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg: unknown }).msg);
        }
        return null;
      })
      .filter(Boolean);
    if (parts.length > 0) return parts.join("; ");
  }
  return fallback;
}

async function pqrsFetch<T>(
  path: string,
  init?: RequestInit & { query?: Record<string, string | undefined> },
): Promise<T> {
  const { query, ...requestInit } = init ?? {};
  const res = await fetch(pqrsUrl(path, query), {
    ...requestInit,
    headers: {
      "Content-Type": "application/json",
      ...(requestInit.headers ?? {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(extractErrorDetail(err, res.statusText || "Error en PQRS"));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export async function fileToPqrsImage(file: File): Promise<CreatePqrsImageRequest> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return {
    filename: file.name,
    mime_type: file.type,
    content_base64: btoa(binary),
  };
}

/**
 * Crea una PQRS en ms-ai (sin Authorization).
 * Las imágenes van como JSON base64, no FormData.
 */
export async function createPqrs(input: CreatePqrsInput): Promise<Pqrs> {
  const base = getMsAiBaseUrl();
  if (!base) {
    throw new Error("VITE_MS_AI_URL no está configurada");
  }

  const images = input.images
    ? await Promise.all(input.images.slice(0, 3).map(fileToPqrsImage))
    : [];

  const res = await fetch(`${base}${ENDPOINTS.PQRS.BASE}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: input.type,
      description: input.description,
      user_id: input.userId,
      user_email: input.userEmail,
      ...(input.category ? { category: input.category } : {}),
      images,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(extractErrorDetail(err, "Error creando PQRS"));
  }

  return (await res.json()) as Pqrs;
}

export async function listPqrs(query?: ListPqrsQuery): Promise<Pqrs[]> {
  const params: Record<string, string | undefined> = {};
  if (query?.user_email) {
    // encodeURIComponent vía URLSearchParams / URL
    params.user_email = query.user_email;
  }
  if (query?.status) params.status = query.status;
  if (query?.category) params.category = query.category;

  return pqrsFetch<Pqrs[]>(ENDPOINTS.PQRS.BASE, {
    method: "GET",
    query: params,
  });
}

export async function getPqrsByTicket(ticketNumber: string): Promise<Pqrs> {
  return pqrsFetch<Pqrs>(ENDPOINTS.PQRS.BY_TICKET(encodeURIComponent(ticketNumber)), {
    method: "GET",
  });
}

export async function getPqrs(pqrsId: string): Promise<Pqrs> {
  return pqrsFetch<Pqrs>(ENDPOINTS.PQRS.BY_ID(encodeURIComponent(pqrsId)), {
    method: "GET",
  });
}

export async function updatePqrs(
  pqrsId: string,
  payload: UpdatePqrsRequest,
): Promise<Pqrs> {
  return pqrsFetch<Pqrs>(ENDPOINTS.PQRS.BY_ID(encodeURIComponent(pqrsId)), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deletePqrs(pqrsId: string): Promise<void> {
  await pqrsFetch<void>(ENDPOINTS.PQRS.BY_ID(encodeURIComponent(pqrsId)), {
    method: "DELETE",
  });
}

export async function createPqrsUpdate(
  pqrsId: string,
  payload: CreatePqrsUpdateRequest,
): Promise<PqrsUpdate> {
  return pqrsFetch<PqrsUpdate>(ENDPOINTS.PQRS.UPDATES(encodeURIComponent(pqrsId)), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listPqrsUpdates(pqrsId: string): Promise<PqrsUpdate[]> {
  return pqrsFetch<PqrsUpdate[]>(ENDPOINTS.PQRS.UPDATES(encodeURIComponent(pqrsId)), {
    method: "GET",
  });
}

export async function getPqrsUpdate(
  pqrsId: string,
  updateId: string,
): Promise<PqrsUpdate> {
  return pqrsFetch<PqrsUpdate>(
    ENDPOINTS.PQRS.UPDATE_BY_ID(encodeURIComponent(pqrsId), encodeURIComponent(updateId)),
    { method: "GET" },
  );
}
