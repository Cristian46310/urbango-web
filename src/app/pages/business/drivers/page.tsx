import { createColumnHelper } from "@tanstack/react-table";
import { BusinessCrudPage } from "@/app/components/business/business-crud-page";
import { TextField } from "@/app/components/business/form-fields";
import { useDriverAdmin } from "@/hooks/business";
import type { Driver } from "@/core/domain/entities/business";

interface DriverForm {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
}

const initialForm: DriverForm = {
  id: "",
  name: "",
  document: "",
  email: "",
  phone: "",
  licenseNumber: "",
  licenseExpiry: "",
};
const columnHelper = createColumnHelper<Driver>();

function toIsoDate(value: string) {
  if (!value) return value;
  if (value.includes("T")) return value;
  return new Date(value).toISOString();
}

function buildPayload(form: DriverForm) {
  return {
    name: form.name.trim(),
    document: form.document.trim() || undefined,
    email: form.email.trim() || undefined,
    phone: form.phone.trim() || undefined,
    licenseNumber: form.licenseNumber.trim(),
    licenseExpiry: toIsoDate(form.licenseExpiry),
  };
}

export default function DriversAdminPage() {
  const crud = useDriverAdmin();

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
        name: e.name,
        document: e.document ?? "",
        email: e.email ?? "",
        phone: e.phone ?? "",
        licenseNumber: e.licenseNumber,
        licenseExpiry: e.licenseExpiry.slice(0, 10),
      })}
      getId={(f) => f.id}
      buildCreatePayload={buildPayload}
      buildUpdatePayload={buildPayload}
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
