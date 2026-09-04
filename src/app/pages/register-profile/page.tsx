import { PersonRegistrationForm } from "@/app/components/person-registration/PersonRegistrationForm";
import { PageShell } from "@/app/components/security/page-shell";

export default function RegisterProfilePage() {
  return (
    <PageShell
      title="Registro de perfil"
      description="Completa tu perfil ciudadano o conductor en ms-business. La foto se sube aparte después de crear el perfil."
    >
      <PersonRegistrationForm />
    </PageShell>
  );
}
