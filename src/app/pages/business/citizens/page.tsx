import { createColumnHelper } from "@tanstack/react-table";
import { BusinessCrudPage } from "@/app/components/business/business-crud-page";
import { formatOptionalText } from "@/app/components/business/constants";
import { TextField } from "@/app/components/business/form-fields";
import { useCitizen } from "@/hooks/business";
import type { Citizen } from "@/core/domain/entities/business";

interface CitizenForm {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  extraInfo: string;
  address: string;
  city: string;
}

const initialForm: CitizenForm = {
  id: "",
  name: "",
  document: "",
  email: "",
  phone: "",
  extraInfo: "",
  address: "",
  city: "",
};
const columnHelper = createColumnHelper<Citizen>();

function buildPayload(form: CitizenForm) {
  const addressText = form.address.trim();
  const city = form.city.trim();
  return {
    name: form.name.trim(),
    document: form.document.trim(),
    email: form.email.trim() || undefined,
    phone: form.phone.trim() || undefined,
    extraInfo: form.extraInfo.trim() || undefined,
    ...(addressText && city
      ? { address: { address: addressText, city } }
      : {}),
  };
}

export default function CitizensPage() {
  const crud = useCitizen();

  return (
    <BusinessCrudPage
      title="Ciudadanos"
      description="Administra perfiles de ciudadanos."
      tableTitle="Listado de ciudadanos"
      tableDescription="Ciudadanos registrados."
      entityLabel="ciudadano"
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
        document: e.document,
        email: e.email ?? "",
        phone: e.phone ?? "",
        extraInfo: e.extraInfo ?? "",
        address: e.address?.address ?? "",
        city: e.address?.city ?? "",
      })}
      getId={(f) => f.id}
      buildCreatePayload={buildPayload}
      buildUpdatePayload={buildPayload}
      columns={[
        columnHelper.accessor("name", { header: "Nombre" }),
        columnHelper.accessor("document", { header: "Documento" }),
        columnHelper.accessor("email", {
          header: "Email",
          cell: (i) => formatOptionalText(i.getValue() as string | undefined),
        }),
        columnHelper.accessor((row) => row.address?.city, {
          id: "city",
          header: "Ciudad",
          cell: (i) => formatOptionalText(i.getValue() as string | undefined),
        }),
      ]}
      renderForm={(form, setForm, mode) => (
        <>
          <TextField id="name" label="Nombre" value={form.name} onChange={(v) => { setForm((c) => ({ ...c, name: v })); }} disabled={mode === "view"} />
          <TextField id="document" label="Documento" value={form.document} onChange={(v) => { setForm((c) => ({ ...c, document: v })); }} disabled={mode === "view"} />
          <TextField id="email" label="Email" value={form.email} onChange={(v) => { setForm((c) => ({ ...c, email: v })); }} disabled={mode === "view"} type="email" />
          <TextField id="phone" label="Teléfono" value={form.phone} onChange={(v) => { setForm((c) => ({ ...c, phone: v })); }} disabled={mode === "view"} />
          <TextField id="extraInfo" label="Info adicional" value={form.extraInfo} onChange={(v) => { setForm((c) => ({ ...c, extraInfo: v })); }} disabled={mode === "view"} />
          <TextField id="address" label="Dirección" value={form.address} onChange={(v) => { setForm((c) => ({ ...c, address: v })); }} disabled={mode === "view"} placeholder="Calle 10 #20-30" />
          <TextField id="city" label="Ciudad" value={form.city} onChange={(v) => { setForm((c) => ({ ...c, city: v })); }} disabled={mode === "view"} placeholder="Manizales" />
        </>
      )}
    />
  );
}
