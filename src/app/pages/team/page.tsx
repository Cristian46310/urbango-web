import { PageShell } from "@/app/components/security/page-shell";
import { CardGithub } from "@/app/components";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Student } from "@/core/types/Student";

const students: Student[] = [
  {
    name: "Cristian",
    github: "Cristian46310",
    url: "https://github.com/Cristian46310",
  },
  {
    name: "Cristian Marin",
    github: "CristianMarinS",
    url: "https://github.com/CristianMarinS",
  },
  {
    name: "Juan Manoel",
    github: "JuManoel",
    url: "https://github.com/JuManoel",
  },
];

export default function TeamPage() {
  return (
    <PageShell
      title="Equipo"
      description="Personas que construyen y mantienen este modulo."
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {students.map((student) => (
            <CardGithub key={student.github} student={student} />
          ))}
        </div>

        <Card className="border-(--security-border) bg-(--security-surface) shadow-sm">
          <CardHeader className="text-xl font-semibold text-(--security-foreground)">
            Universidad de Caldas
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-(--security-muted-foreground)">
            Este equipo desarrolla soluciones tecnicas para fortalecer procesos academicos y administrativos,
            con enfoque en calidad de software, buenas practicas y experiencia de usuario.
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
