import { TicketAlightSearch } from "@/app/components/ticket/TicketAlightSearch";
import { PageShell } from "@/app/components/security/page-shell";

export default function TicketAlightSearchPage() {
  return (
    <PageShell
      title="Descenso"
      description="Cierra tu viaje seleccionando tu boleto activo"
      titleSize="lg"
    >
      <TicketAlightSearch />
    </PageShell>
  );
}
