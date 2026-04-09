import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useLogin } from "@/hooks/security";
import { OAuthProviders } from "./OAuthProviders";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [, setChallengeMessage] = useState("");
  const [expiration, setExpiration] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"credentials" | "challenge">(
    "credentials",
  );

  const navigate = useNavigate();
  const { loading, error, login, verify2FA } = useLogin();

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleCredentialsSubmit = async () => {
    try {
      const response = await login({
        email: email.trim(),
        password,
      });

      setChallengeToken(response.challengeToken);
      setChallengeMessage(response.message);
      setExpiration(response.expiration);
      setPhase("challenge");
      toast.success("Credenciales validadas, falta el segundo factor");
    } catch (submitError) {
      toast.error((submitError as Error).message);
    }
  };

  const handle2FASubmit = async () => {
    try {
      await verify2FA({
        challengeToken,
        code,
      });

      toast.success("Inicio de sesión completado");
      void navigate("/app");
    } catch (submitError) {
      toast.error((submitError as Error).message);
    }
  };

  return (
    <div className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-14">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
            Iniciar sesion
          </h1>
          <p className="max-w-sm text-lg leading-6 text-slate-500 sm:text-base">
            Accede con tus credenciales para administrar rutas, flotas y
            monitoreo en tiempo real.
          </p>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">
            Sistema de buses inteligentes
          </p>
        </div>

        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader className="sr-only">
            <h2>Iniciar sesion</h2>
          </CardHeader>

          <CardContent className="p-0">
            {phase === "credentials" ? (
              <form
                className="space-y-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleCredentialsSubmit();
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="email">Correo electronico</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="size-4 cursor-help text-slate-400 transition-colors hover:text-slate-600" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ingresa tu correo.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="cristian.marin1234@ucaldas.edu.co"
                    value={email}
                    onChange={(event) => { setEmail(event.target.value); }}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 px-4"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="password">Contrasena</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="size-4 cursor-help text-slate-400 transition-colors hover:text-slate-600" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Tu contrasena de acceso.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="........"
                    value={password}
                    onChange={(event) => { setPassword(event.target.value); }}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 px-4"
                  />
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-accent text-base font-medium text-white hover:bg-accent-foreground"
                  disabled={loading}
                >
                  {loading ? "Validando..." : "Continuar"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">O continúa con</span>
                  </div>
                </div>

                <OAuthProviders />
              </form>
            ) : (
              <form
                className="space-y-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handle2FASubmit();
                }}
              >
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-medium text-slate-900">En el correo: {email}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Debio llegar el codigo para confirmar el ingreso.
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Expira: {new Date(expiration).toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Codigo 2FA</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(event) => { setCode(event.target.value); }}
                    placeholder="000000"
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 px-4 tracking-[0.35em]"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl bg-accent text-base font-medium text-white hover:bg-accent-foreground"
                    disabled={loading}
                  >
                    {loading ? "Verificando..." : "Validar codigo"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    onClick={() => { setPhase("credentials"); }}
                  >
                    Volver
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
