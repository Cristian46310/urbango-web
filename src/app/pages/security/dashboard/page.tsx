import { Link } from "react-router-dom";
import { ArrowRight, BookUser, KeyRound, Shield, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageShell } from "@/app/components/security/page-shell";

const quickLinks = [
  { title: "Usuarios", to: "/app/users", icon: Users },
  { title: "Permisos", to: "/app/permissions", icon: KeyRound },
  { title: "Roles", to: "/app/roles", icon: Shield },
  { title: "Equipo", to: "/app/team", icon: BookUser },
];

export default function DashboardPage() {
  return (
    <PageShell
      title="Inicio"
      description="Resumen general del modulo de seguridad."
      aside={
        <div className="space-y-3">
          <p>Usa el menu lateral para entrar rapido a cada gestion.</p>
          <p>Las pantallas principales ya usan tablas, acciones por menu y dialogos de edicion.</p>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickLinks.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.to} className="border-(--security-border) bg-(--security-surface) shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <Icon className="size-5 text-(--security-foreground)" />
                  <p className="mt-3 text-lg font-semibold text-(--security-foreground)">{item.title}</p>
                </div>
                <Button asChild size="icon" variant="outline" className="border-(--security-border) bg-card text-(--security-foreground) hover:bg-(--security-surface)">
                  <Link to={item.to}>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div
        className="mt-6 rounded-2xl border border-(--security-border) p-6 text-white shadow-sm"
        style={{
          backgroundImage:
            "linear-gradient(140deg, var(--security-hero-start) 0%, var(--security-hero-end) 100%)",
        }}
      >
        <p className="text-sm uppercase tracking-[0.18em] text-white/75">Flujo recomendado</p>
        <h3 className="mt-2 text-2xl font-semibold">Empieza por Gestion de usuarios</h3>
        <p className="mt-3 max-w-2xl text-sm text-white/85">
          Desde ahi puedes crear cuentas y luego continuar con perfiles, roles y permisos segun el flujo de seguridad.
        </p>
      </div>
    </PageShell>
  );
}