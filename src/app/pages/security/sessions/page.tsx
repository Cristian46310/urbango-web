import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/app/components/security/data-table";
import { PageShell } from "@/app/components/security/page-shell";
import { useSession } from "@/hooks/security";
import { createColumnHelper } from "@tanstack/react-table";
import type { Session } from "@/core/domain/entities/security/Session";
import type { User } from "@/core/domain/entities/security/User";

interface SessionForm {
  id: string;
  token: string;
  expiration: string;
  code2FA: string;
  user: string;
}

const initialForm: SessionForm = {
  id: "",
  token: "",
  expiration: "",
  code2FA: "",
  user: "{\n  \"id\": \"\",\n  \"name\": \"\",\n  \"email\": \"\",\n  \"password\": \"\"\n}",
};

type SessionRow = Omit<Session, "expiration"> & { expiration: Date | string };

export default function SessionsPage() {
  const { sessions, loading, error, loadSessions, addSession, editSession, removeSession } = useSession();
  const [form, setForm] = useState<SessionForm>(initialForm);

  const columnHelper = createColumnHelper<SessionRow>();
  const columns = [
    columnHelper.accessor("id", { header: "ID", cell: (info) => info.getValue() }),
    columnHelper.accessor("token", { header: "Token", cell: (info) => info.getValue() }),
    columnHelper.accessor("expiration", {
      header: "Expiración",
      cell: (info) => {
        const value = info.getValue();
        return value instanceof Date ? value.toLocaleString() : value;
      },
    }),
    columnHelper.accessor("code2FA", { header: "2FA", cell: (info) => info.getValue() }),
    columnHelper.display({
      id: "actions",
      header: "Acciones",
      cell: (info) => {
        const session = info.row.original;
        return (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setForm({
                  id: session.id,
                  token: session.token,
                  expiration:
                    session.expiration instanceof Date
                      ? session.expiration.toISOString().slice(0, 16)
                      : session.expiration.slice(0, 16),
                  code2FA: session.code2FA,
                  user: JSON.stringify(session.user, null, 2),
                });
              }}
            >
              Editar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => {
                void (async () => {
                  await removeSession(session.id);
                  await loadSessions();
                })();
              }}
            >
              Eliminar
            </Button>
          </div>
        );
      },
    }),
  ];
  useEffect(() => {
    void loadSessions();
  }, []);

  const handleSubmit = async () => {
    try {
      const user = JSON.parse(form.user) as User;
      const payload = {
        token: form.token.trim(),
        expiration: form.expiration ? new Date(form.expiration) : new Date(),
        code2FA: form.code2FA.trim(),
        user,
      };

      if (!payload.token || !form.expiration || !payload.code2FA) {
        throw new Error("Token, expiración y código 2FA son obligatorios");
      }

      if (form.id.trim()) {
        await editSession(form.id, payload);
        toast.success("Sesión actualizada");
      } else {
        await addSession(payload);
        toast.success("Sesión creada");
      }

      setForm(initialForm);
      await loadSessions();
    } catch (submitError) {
      toast.error(submitError instanceof SyntaxError ? "El campo user debe ser JSON válido" : (submitError as Error).message);
    }
  };

  return (
    <PageShell
      title="Sesiones"
      description="Administración de sesiones, token, expiración y código 2FA."
      aside={
        <div className="space-y-3">
          <p>El formulario usa una fecha ISO para la expiración y un JSON para el usuario asociado.</p>
          <p>Si el backend devuelve una fecha como string, la tabla la muestra tal cual.</p>
        </div>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <form
          className="space-y-4 rounded-2xl border border-(--security-border) bg-(--security-surface) p-5 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <div>
            <Label htmlFor="session-id">ID opcional para editar</Label>
            <Input
              id="session-id"
              value={form.id}
              onChange={(event) => { setForm((current) => ({ ...current, id: event.target.value })); }}
            />
          </div>
          <div>
            <Label htmlFor="session-token">Token</Label>
            <Input
              id="session-token"
              value={form.token}
              onChange={(event) => { setForm((current) => ({ ...current, token: event.target.value })); }}
            />
          </div>
          <div>
            <Label htmlFor="session-expiration">Expiración</Label>
            <Input
              id="session-expiration"
              type="datetime-local"
              value={form.expiration}
              onChange={(event) => { setForm((current) => ({ ...current, expiration: event.target.value })); }}
            />
          </div>
          <div>
            <Label htmlFor="session-code">Código 2FA</Label>
            <Input
              id="session-code"
              value={form.code2FA}
              onChange={(event) => { setForm((current) => ({ ...current, code2FA: event.target.value })); }}
            />
          </div>
          <div>
            <Label htmlFor="session-user">Usuario JSON</Label>
            <Textarea
              id="session-user"
              rows={8}
              value={form.user}
              onChange={(event) => { setForm((current) => ({ ...current, user: event.target.value })); }}
            />
          </div>
          <Button type="submit" className="w-full">
            {form.id.trim() ? "Actualizar sesión" : "Crear sesión"}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => { setForm(initialForm); }}>
            Limpiar
          </Button>
        </form>

        <DataTable
          title="Listado de sesiones"
          description="Sesiones cargadas por el hook."
          data={sessions}
          loading={loading}
          error={error}
          onRefresh={() => void loadSessions()}
          emptyMessage="No hay sesiones cargadas."
          columns={columns}
        />
      </div>
    </PageShell>
  );
}