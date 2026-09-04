import IncidentReportButton from "@/app/components/incident-report/IncidentReportButton";
import { PageShell } from "@/app/components/security/page-shell";

export default function IncidentReportPage() {
  return (
    <PageShell
      title="Reportar incidente"
      description="Registra cualquier novedad ocurrida durante tu turno"
      titleSize="lg"
    >
      <IncidentReportButton />
    </PageShell>
  );
}
