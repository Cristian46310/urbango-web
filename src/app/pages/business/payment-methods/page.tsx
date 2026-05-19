import { createColumnHelper } from "@tanstack/react-table";
import { BusinessCrudPage } from "@/app/components/business/business-crud-page";
import { TextField } from "@/app/components/business/form-fields";
import { usePaymentMethod } from "@/hooks/business";
import type { PaymentMethod } from "@/core/domain/entities/business";

interface Form {
  id: string;
  name: string;
}

const initialForm: Form = { id: "", name: "" };
const columnHelper = createColumnHelper<PaymentMethod>();

export default function PaymentMethodsPage() {
  const crud = usePaymentMethod();

  return (
    <BusinessCrudPage
      title="Métodos de pago"
      description="Catálogo de métodos de pago."
      tableTitle="Listado de métodos"
      tableDescription="Métodos de pago disponibles."
      entityLabel="método de pago"
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
      mapToForm={(e) => ({ id: e.id, name: e.name })}
      getId={(f) => f.id}
      buildCreatePayload={(f) => ({ name: f.name.trim() })}
      buildUpdatePayload={(f) => ({ name: f.name.trim() })}
      columns={[columnHelper.accessor("name", { header: "Nombre" })]}
      renderForm={(form, setForm, mode) => (
        <TextField
          id="name"
          label="Nombre"
          value={form.name}
          onChange={(v) => { setForm((c) => ({ ...c, name: v })); }}
          disabled={mode === "view"}
        />
      )}
    />
  );
}
