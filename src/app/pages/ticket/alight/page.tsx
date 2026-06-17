import { TicketAlightSearch } from "@/app/components/ticket/TicketAlightSearch";
import { PageShell } from "@/app/components/security/page-shell";

export default function TicketAlightSearchPage() {
  return (
    <PageShell title="Descenso" description="Selecciona tu boleto activo o ingresa el ID manualmente.">
      <TicketAlightSearch />
    </PageShell>
  );
}
