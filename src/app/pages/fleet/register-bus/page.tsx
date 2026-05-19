import { BusRegistrationForm } from '@/app/components/fleet/BusRegistrationForm';
import { PageShell } from '@/app/components/security/page-shell';

export default function RegisterBusPage() {
  return (
    <PageShell
      title="Registro de bus en flota"
      description="Registra un nuevo vehículo en la flota de tu empresa para asignarlo a rutas y programaciones."
    >
      <BusRegistrationForm />
    </PageShell>
  );
}
