import { useCallback, useEffect, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { BusinessCrudPage } from "@/app/components/business/business-crud-page";
import {
  SearchableSelectField,
  TextField,
} from "@/app/components/business/form-fields";
import { DialogField } from "@/app/components/security/dialog-field";
import { Input } from "@/components/ui/input";
import { useDriverAdmin } from "@/hooks/business";
import type {
  Driver,
  Enterprise,
  UpdateDriverDTO,
} from "@/core/domain/entities/business";
import type { User } from "@/core/domain/entities/security/User";
import { enterpriseRepository } from "@/infra/repository/business/repositories";
import { userRepository } from "@/infra/repository/security/UserRepository";
import { showErrorToast } from "@/lib/toast";

interface DriverForm {
  id: string;
  userId: string;
  userLabel: string;
  enterpriseId: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
}

const initialForm: DriverForm = {
  id: "",
  userId: "",
  userLabel: "",
  enterpriseId: "",
  name: "",
  document: "",
  email: "",
  phone: "",
  licenseNumber: "",
  licenseExpiry: "",
};
const columnHelper = createColumnHelper<Driver>();

function buildCreatePayload(form: DriverForm) {
  return {
    userId: form.userId,
    enterpriseId: form.enterpriseId,
    name: form.name.trim(),
    document: form.document.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    licenseNumber: form.licenseNumber.trim(),
    licenseExpiry: form.licenseExpiry,
  };
}

function buildUpdatePayload(form: DriverForm): UpdateDriverDTO {
  return {
    name: form.name.trim(),
    document: form.document.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    licenseNumber: form.licenseNumber.trim(),
    licenseExpiry: form.licenseExpiry,
  };
}

function SecurityUserSearch({
  value,
  selectedLabel,
  disabled,
  onSelect,
}: {
  value: string;
  selectedLabel: string;
  disabled?: boolean;
  onSelect: (user: User) => void;
}) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<User[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!open || trimmed.length < 2) {
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void userRepository
        .getAllUsers({ page: 0, size: 10, q: trimmed })
        .then((page) => {
          if (!cancelled) setOptions(page.content);
        })
        .catch(() => {
          if (!cancelled) {
            setOptions([]);
            setError("No se pudieron buscar usuarios");
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [open, query]);

  return (
    <DialogField label="Usuario de seguridad">
      <div
        className="relative space-y-1.5"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setOpen(false);
            setQuery("");
          }
        }}
      >
        <Input
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          value={open ? query : selectedLabel}
          placeholder="Buscar por correo o nombre"
          disabled={disabled}
          className="h-11"
          onFocus={() => {
            setQuery("");
            setOptions([]);
            setLoading(false);
            setError(null);
            setOpen(true);
          }}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            if (nextQuery.trim().length < 2) {
              setOptions([]);
              setLoading(false);
              setError(null);
            }
            setOpen(true);
          }}
        />
        {open ? (
          <div
            role="listbox"
            className="absolute z-60 mt-1 max-h-52 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          >
            {query.trim().length < 2 ? (
              <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                Escribe al menos 2 caracteres
              </p>
            ) : loading ? (
              <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                Buscando…
              </p>
            ) : error ? (
              <p className="px-2 py-3 text-center text-sm text-destructive">
                {error}
              </p>
            ) : options.length > 0 ? (
              options.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  role="option"
                  aria-selected={user.id === value}
                  className="flex w-full flex-col rounded-sm px-2 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    onSelect(user);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  <span>{user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </button>
              ))
            ) : (
              <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                Sin resultados
              </p>
            )}
          </div>
        ) : null}
      </div>
    </DialogField>
  );
}

export default function DriversAdminPage() {
  const crud = useDriverAdmin();
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);

  const loadEnterprises = useCallback(async () => {
    try {
      const page = await enterpriseRepository.getAll({ page: 1, limit: 100 });
      setEnterprises(page.items);
    } catch {
      showErrorToast("No se pudieron cargar las empresas");
    }
  }, []);

  return (
    <BusinessCrudPage
      title="Conductores"
      description="Administra conductores registrados."
      tableTitle="Listado de conductores"
      tableDescription="Conductores del sistema."
      entityLabel="conductor"
      filterField="name"
      items={crud.items}
      page={crud.page}
      loading={crud.loading}
      error={crud.error}
      loadItems={crud.loadItems}
      addItem={crud.addItem}
      editItem={crud.editItem}
      removeItem={crud.removeItem}
      initialForm={initialForm}
      mapToForm={(e) => ({
        id: e.id,
        userId: e.userId ?? "",
        userLabel: "",
        enterpriseId: e.enterpriseId ?? "",
        name: e.name,
        document: e.document ?? "",
        email: e.email ?? "",
        phone: e.phone ?? "",
        licenseNumber: e.licenseNumber,
        licenseExpiry: e.licenseExpiry.slice(0, 10),
      })}
      getId={(f) => f.id}
      buildCreatePayload={buildCreatePayload}
      buildUpdatePayload={buildUpdatePayload}
      validateForm={(form, mode) => {
        const commonFields = [
          form.name,
          form.document,
          form.email,
          form.phone,
          form.licenseNumber,
          form.licenseExpiry,
        ];
        const createFields =
          mode === "create"
            ? [form.userId, form.enterpriseId, ...commonFields]
            : commonFields;
        if (createFields.some((value) => !value.trim())) {
          showErrorToast("Completa todos los campos obligatorios");
          return false;
        }
        return true;
      }}
      onDialogOpen={() => {
        void loadEnterprises();
      }}
      columns={[
        columnHelper.accessor("name", { header: "Nombre" }),
        columnHelper.accessor("licenseNumber", { header: "Licencia" }),
        columnHelper.accessor("licenseExpiry", {
          header: "Vence",
          cell: (i) => (i.getValue() ? String(i.getValue()).slice(0, 10) : "—"),
        }),
      ]}
      renderForm={(form, setForm, mode) => (
        <>
          {mode === "create" ? (
            <>
              <SecurityUserSearch
                value={form.userId}
                selectedLabel={form.userLabel}
                onSelect={(user) => {
                  setForm((current) => ({
                    ...current,
                    userId: user.id,
                    userLabel: `${user.name} (${user.email})`,
                    name: user.name,
                    email: user.email,
                  }));
                }}
              />
              <SearchableSelectField
                label="Empresa"
                value={form.enterpriseId}
                onChange={(value) => {
                  setForm((current) => ({
                    ...current,
                    enterpriseId: value,
                  }));
                }}
                placeholder="Seleccionar empresa"
                searchPlaceholder="Buscar empresa..."
                options={enterprises.map((enterprise) => ({
                  value: enterprise.id,
                  label: `${enterprise.name} (${enterprise.nit})`,
                }))}
              />
            </>
          ) : null}
          <TextField id="name" label="Nombre" value={form.name} onChange={(v) => { setForm((c) => ({ ...c, name: v })); }} disabled={mode === "view"} />
          <TextField id="document" label="Documento" value={form.document} onChange={(v) => { setForm((c) => ({ ...c, document: v })); }} disabled={mode === "view"} />
          <TextField id="email" label="Email" value={form.email} onChange={(v) => { setForm((c) => ({ ...c, email: v })); }} disabled={mode === "view"} type="email" />
          <TextField id="phone" label="Teléfono" value={form.phone} onChange={(v) => { setForm((c) => ({ ...c, phone: v })); }} disabled={mode === "view"} />
          <TextField id="licenseNumber" label="Número licencia" value={form.licenseNumber} onChange={(v) => { setForm((c) => ({ ...c, licenseNumber: v })); }} disabled={mode === "view"} />
          <TextField id="licenseExpiry" label="Vencimiento licencia" value={form.licenseExpiry} onChange={(v) => { setForm((c) => ({ ...c, licenseExpiry: v })); }} disabled={mode === "view"} type="date" />
        </>
      )}
    />
  );
}
