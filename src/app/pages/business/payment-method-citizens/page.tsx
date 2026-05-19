import { useEffect, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { BusinessCrudPage } from "@/app/components/business/business-crud-page";
import { formatShortId } from "@/app/components/business/constants";
import { SelectField } from "@/app/components/business/form-fields";
import { BUSINESS_LOOKUP_PAGE_SIZE } from "@/app/components/business/constants";
import { useCitizen, usePaymentMethod, usePaymentMethodCitizen } from "@/hooks/business";
import type { PaymentMethodCitizen } from "@/core/domain/entities/business";

interface Form {
  id: string;
  citizenId: string;
  paymentMethodId: string;
}

const initialForm: Form = { id: "", citizenId: "", paymentMethodId: "" };
const columnHelper = createColumnHelper<PaymentMethodCitizen>();

export default function PaymentMethodCitizensPage() {
  const crud = usePaymentMethodCitizen();
  const citizenCrud = useCitizen();
  const paymentCrud = usePaymentMethod();
  const [citizenOptions, setCitizenOptions] = useState<{ value: string; label: string }[]>([]);
  const [paymentOptions, setPaymentOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    void citizenCrud.loadItems(0, BUSINESS_LOOKUP_PAGE_SIZE).then((p) => {
      setCitizenOptions(p.items.map((c) => ({ value: c.id, label: `${c.name} (${c.document})` })));
    });
    void paymentCrud.loadItems(0, BUSINESS_LOOKUP_PAGE_SIZE).then((p) => {
      setPaymentOptions(p.items.map((m) => ({ value: m.id, label: m.name })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BusinessCrudPage
      title="Pagos por ciudadano"
      description="Vincula métodos de pago a ciudadanos."
      tableTitle="Listado"
      tableDescription="Métodos de pago asignados."
      entityLabel="vínculo"
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
        citizenId: e.citizenId,
        paymentMethodId: e.paymentMethodId,
      })}
      getId={(f) => f.id}
      buildCreatePayload={(f) => ({
        citizenId: f.citizenId,
        paymentMethodId: f.paymentMethodId,
      })}
      buildUpdatePayload={(f) => ({
        citizenId: f.citizenId,
        paymentMethodId: f.paymentMethodId,
      })}
      columns={[
        columnHelper.accessor("citizenId", {
          header: "Ciudadano",
          cell: (i) => formatShortId(String(i.getValue())),
        }),
        columnHelper.accessor("paymentMethodId", {
          header: "Método",
          cell: (i) => formatShortId(String(i.getValue())),
        }),
      ]}
      renderForm={(form, setForm, mode) => (
        <>
          <SelectField
            label="Ciudadano"
            value={form.citizenId}
            onChange={(v) => { setForm((c) => ({ ...c, citizenId: v })); }}
            disabled={mode === "view"}
            options={citizenOptions}
          />
          <SelectField
            label="Método de pago"
            value={form.paymentMethodId}
            onChange={(v) => { setForm((c) => ({ ...c, paymentMethodId: v })); }}
            disabled={mode === "view"}
            options={paymentOptions}
          />
        </>
      )}
    />
  );
}
