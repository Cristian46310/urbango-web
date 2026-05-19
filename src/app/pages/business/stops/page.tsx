import { createColumnHelper } from "@tanstack/react-table";
import { BusinessCrudPage } from "@/app/components/business/business-crud-page";
import { TextField } from "@/app/components/business/form-fields";
import { useStopAdmin } from "@/hooks/business";
import type { Stop } from "@/core/domain/entities/business";

interface StopForm {
  id: string;
  name: string;
  location: string;
  latitude: string;
  longitude: string;
}

const initialForm: StopForm = {
  id: "",
  name: "",
  location: "",
  latitude: "",
  longitude: "",
};
const columnHelper = createColumnHelper<Stop>();

function toPayload(form: StopForm) {
  return {
    name: form.name.trim(),
    location: form.location.trim(),
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
  };
}

export default function StopsAdminPage() {
  const crud = useStopAdmin();

  return (
    <BusinessCrudPage
      title="Paradas"
      description="Administra paradas del sistema de transporte."
      tableTitle="Listado de paradas"
      tableDescription="Paradas registradas."
      entityLabel="parada"
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
        location: e.location,
        latitude: String(e.latitude),
        longitude: String(e.longitude),
      })}
      getId={(f) => f.id}
      buildCreatePayload={toPayload}
      buildUpdatePayload={toPayload}
      columns={[
        columnHelper.accessor("name", { header: "Nombre" }),
        columnHelper.accessor("location", { header: "Ubicación" }),
        columnHelper.accessor("latitude", { header: "Lat" }),
        columnHelper.accessor("longitude", { header: "Lon" }),
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
            id="location"
            label="Ubicación"
            value={form.location}
            onChange={(v) => { setForm((c) => ({ ...c, location: v })); }}
            disabled={mode === "view"}
          />
          <TextField
            id="latitude"
            label="Latitud"
            value={form.latitude}
            onChange={(v) => { setForm((c) => ({ ...c, latitude: v })); }}
            disabled={mode === "view"}
            type="number"
          />
          <TextField
            id="longitude"
            label="Longitud"
            value={form.longitude}
            onChange={(v) => { setForm((c) => ({ ...c, longitude: v })); }}
            disabled={mode === "view"}
            type="number"
          />
        </>
      )}
    />
  );
}
