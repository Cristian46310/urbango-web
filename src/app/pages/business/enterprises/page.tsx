import { createColumnHelper } from "@tanstack/react-table";
import { BusinessCrudPage } from "@/app/components/business/business-crud-page";
import { TextField } from "@/app/components/business/form-fields";
import { useEnterprise } from "@/hooks/business";
import type { Enterprise } from "@/core/domain/entities/business";

interface EnterpriseForm {
  id: string;
  name: string;
  nit: string;
}

const initialForm: EnterpriseForm = { id: "", name: "", nit: "" };
const columnHelper = createColumnHelper<Enterprise>();

export default function EnterprisesPage() {
  const crud = useEnterprise();

  return (
    <BusinessCrudPage
      title="Empresas"
      description="Administra empresas de transporte."
      tableTitle="Listado de empresas"
      tableDescription="Empresas registradas."
      entityLabel="empresa"
      filterField="name"
      filterPlaceholder="Buscar por nombre"
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
        nit: e.nit,
      })}
      getId={(f) => f.id}
      buildCreatePayload={(f) => ({
        name: f.name.trim(),
        nit: f.nit.trim(),
      })}
      buildUpdatePayload={(f) => ({
        name: f.name.trim(),
        nit: f.nit.trim(),
      })}
      columns={[
        columnHelper.accessor("name", { header: "Nombre" }),
        columnHelper.accessor("nit", { header: "NIT" }),
      ]}
      renderForm={(form, setForm, mode) => (
        <>
          <TextField
            id="name"
            label="Nombre"
            value={form.name}
            onChange={(v) => { setForm((c) => ({ ...c, name: v })); }}
            disabled={mode === "view"}
          />
          <TextField
            id="nit"
            label="NIT"
            value={form.nit}
            onChange={(v) => { setForm((c) => ({ ...c, nit: v })); }}
            disabled={mode === "view"}
          />
        </>
      )}
    />
  );
}
