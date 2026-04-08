import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Student } from "@/core/types/Student";
import { CardGithub } from "@/app/components";

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
    name: "Juan Manuel",
    github: "JuManoel",
    url: "https://github.com/JuManoel",
  },
];

export default function TeamPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Equipo de Desarrollo
          </h1>
          <p className="text-lg text-slate-700 mb-6">
            Somos{" "}
            <span className="font-semibold text-blue-600">
              {students.length} estudiantes
            </span>{" "}
            de la{" "}
            <span className="font-semibold text-blue-600">
              Universidad de Caldas
            </span>{" "}
            trabajando juntos en este proyecto.
          </p>
          <Separator className="my-6" />
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {students.map((student) => (
            <CardGithub key={student.github} student={student} />
          ))}
        </div>

        {/* University Info */}
        <Card className="bg-blue-50 border-blue-200 p-8 mb-8">
          <CardHeader className="text-2xl font-bold text-slate-900 mb-4">
            Universidad de Caldas
          </CardHeader>
          <CardContent className="text-slate-700 leading-relaxed">
            Este equipo está formado por estudiantes de la Universidad de
            Caldas, ubicada en Manizales, Colombia. Trabajamos en el desarrollo
            de soluciones tecnológicas innovadoras que contribuyan a mejorar
            procesos administrativos y académicos dentro de la institución.
          </CardContent>
        </Card>

        {/* Logout Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => void navigate("/login")}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-2.5 rounded-md transition-colors"
          >
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
