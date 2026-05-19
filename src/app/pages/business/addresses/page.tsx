import { createColumnHelper } from "@tanstack/react-table";
import { BusinessCrudPage } from "@/app/components/business/business-crud-page";
import { formatShortId } from "@/app/components/business/constants";
import { TextField } from "@/app/components/business/form-fields";
import { useAddress } from "@/hooks/business";
import type { Address } from "@/core/domain/entities/business";

interface AddressForm {
  id: string;
  address: string;
  city: string;
}

const initialForm: AddressForm = { id: "", address: "", city: "" };
const columnHelper = createColumnHelper<Address>();

export default function AddressesPage() {
  const crud = useAddress();

  return (
    <BusinessCrudPage
      title="Direcciones"
      description="Administra direcciones de ciudadanos."
      tableTitle="Listado de direcciones"
      tableDescription="Direcciones registradas en el sistema."
      entityLabel="dirección"
      filterField="address"
      filterPlaceholder="Buscar por dirección"
      items={crud.items}
      page={crud.page}
      loading={crud.loading}
      error={crud.error}
      loadItems={crud.loadItems}
      addItem={crud.addItem}
      editItem={crud.editItem}
      removeItem={crud.removeItem}
      initialForm={initialForm}
      mapToForm={(e) => ({ id: e.id, address: e.address, city: e.city })}
      getId={(f) => f.id}
      buildCreatePayload={(f) => ({ address: f.address.trim(), city: f.city.trim() })}
      buildUpdatePayload={(f) => ({ address: f.address.trim(), city: f.city.trim() })}
      columns={[
        columnHelper.accessor("id", { header: "ID", cell: (i) => formatShortId(String(i.getValue())) }),
        columnHelper.accessor("address", { header: "Dirección" }),
        columnHelper.accessor("city", { header: "Ciudad" }),
      ]}
      renderForm={(form, setForm, mode) => (
        <>
          <TextField
            id="address"
            label="Dirección"
            value={form.address}
            onChange={(v) => { setForm((c) => ({ ...c, address: v })); }}
            disabled={mode === "view"}
          />
          <TextField
            id="city"
            label="Ciudad"
            value={form.city}
            onChange={(v) => { setForm((c) => ({ ...c, city: v })); }}
            disabled={mode === "view"}
          />
        </>
      )}
    />
  );
}
