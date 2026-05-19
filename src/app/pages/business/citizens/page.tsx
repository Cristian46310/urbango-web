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
  addressId: string;
}

const initialForm: CitizenForm = {
  id: "",
  name: "",
  document: "",
  email: "",
  phone: "",
  extraInfo: "",
  addressId: "",
};
const columnHelper = createColumnHelper<Citizen>();

function buildPayload(form: CitizenForm) {
  return {
    name: form.name.trim(),
    document: form.document.trim(),
    email: form.email.trim() || undefined,
    phone: form.phone.trim() || undefined,
    extraInfo: form.extraInfo.trim() || undefined,
    addressId: form.addressId.trim() || undefined,
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
        addressId: e.addressId ?? "",
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
      ]}
      renderForm={(form, setForm, mode) => (
        <>
          <TextField id="name" label="Nombre" value={form.name} onChange={(v) => { setForm((c) => ({ ...c, name: v })); }} disabled={mode === "view"} />
          <TextField id="document" label="Documento" value={form.document} onChange={(v) => { setForm((c) => ({ ...c, document: v })); }} disabled={mode === "view"} />
          <TextField id="email" label="Email" value={form.email} onChange={(v) => { setForm((c) => ({ ...c, email: v })); }} disabled={mode === "view"} type="email" />
          <TextField id="phone" label="Teléfono" value={form.phone} onChange={(v) => { setForm((c) => ({ ...c, phone: v })); }} disabled={mode === "view"} />
          <TextField id="extraInfo" label="Info adicional" value={form.extraInfo} onChange={(v) => { setForm((c) => ({ ...c, extraInfo: v })); }} disabled={mode === "view"} />
          <TextField id="addressId" label="ID dirección" value={form.addressId} onChange={(v) => { setForm((c) => ({ ...c, addressId: v })); }} disabled={mode === "view"} />
        </>
      )}
    />
  );
}
