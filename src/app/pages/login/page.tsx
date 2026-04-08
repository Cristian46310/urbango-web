import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      // TODO: mover esa logica para su debido lugar, store
      if (email.trim() && password.trim()) {
        void navigate("/team");
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
    }
  };

  return (
    <Card className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg border border-slate-200">
        <CardHeader className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Iniciar Sesión</h1>
          <p className="mt-2 text-sm text-slate-600">
            Universidad de Caldas - Sistema de Gestión
          </p>
        </CardHeader>

        <CardContent className="space-y-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Label
              htmlFor="email"
              className="block text-sm font-semibold text-slate-700"
            >
              Correo Electrónico
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ingresa tu correo institucional</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="email"
            type="email"
            placeholder="cristian.marin1234@ucaldas.edu.co"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            className="mt-2 border-slate-300"
            required
          />

          <div className="flex items-center gap-2 mb-2">
            <Label
              htmlFor="password"
              className="block text-sm font-semibold text-slate-700"
            >
              Contraseña
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tu contraseña de acceso</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            className="mt-2 border-slate-300"
            required
          />
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-md transition-colors"
            onClick={handleLogin}
          >
            Ingresar
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
