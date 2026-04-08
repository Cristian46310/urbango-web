import { Link } from "react-router-dom";
import { ArrowRight, KeyRound, LockKeyhole, Shield, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageShell } from "@/app/components/security/page-shell";

const quickLinks = [
  { title: "Usuarios", to: "/app/users", icon: Users },
  { title: "Permisos", to: "/app/permissions", icon: KeyRound },
  { title: "Sesiones", to: "/app/sessions", icon: LockKeyhole },
  { title: "Seguridad", to: "/app/roles", icon: Shield },
];

export default function DashboardPage() {
  return (
    <PageShell
      title="Inicio"
      description="Resumen del panel de seguridad y accesos basado en los hooks disponibles."
      aside={
        <div className="space-y-3">
          <p>Usa el sidebar para entrar al CRUD o flujo específico que expone cada hook.</p>
          <p>El login usa un primer paso con email y contraseña, seguido de la validación 2FA.</p>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickLinks.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.to} className="border-slate-200 bg-slate-50 shadow-none">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <Icon className="size-5 text-slate-900" />
                  <p className="mt-3 text-lg font-semibold text-slate-900">{item.title}</p>
                </div>
                <Button asChild size="icon" variant="outline">
                  <Link to={item.to}>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white">
        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Flujo recomendado</p>
        <h3 className="mt-2 text-2xl font-semibold">Empieza por Usuarios</h3>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          El resto de los módulos siguen la misma lógica visual: formulario de entrada, acciones concretas y tabla de resultados cuando el hook expone lectura de datos.
        </p>
      </div>
    </PageShell>
  );
}