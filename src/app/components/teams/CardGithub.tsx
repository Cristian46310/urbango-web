import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Github, ExternalLink } from "lucide-react";
import type { Student } from "@/core/types/Student";

type CardGithubProps = {
  student: Student;
};

export default function CardGithub({ student }: CardGithubProps) {
  return (
    <Card
      key={student.github}
      className="p-8 hover:shadow-xl transition-all duration-300 bg-white border-slate-200 hover:border-blue-300 flex flex-col items-center text-center"
    >
      <CardContent className="mb-6 flex flex-col items-center">
        {/* GitHub Avatar */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <img
                  src={`https://github.com/${student.github}.png?size=120`}
                  alt={student.name}
                  className="w-28 h-28 rounded-full border-4 border-blue-200 hover:border-blue-400 transition-colors"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Perfil de GitHub</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {/* Name */}
        <h2 className="text-2xl font-bold text-slate-900 mb-1">
          {student.name}
        </h2>

        {/* GitHub Handle */}
        <p className="text-sm text-slate-500 mb-2">@{student.github}</p>
      </CardContent>

      <CardFooter>
        {/* GitHub Link */}
        <Button
          asChild
          className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors gap-2"
        >
          <a href={student.url} target="_blank" rel="noopener noreferrer">
            <Github size={18} />
            Ver Perfil
            <ExternalLink size={16} />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
