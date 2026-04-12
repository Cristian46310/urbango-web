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
import { recaptchaConfig } from "@/config/recaptcha";
import { executeRecaptcha } from "@/lib/recaptcha";
import { OAuthProviders } from "./OAuthProviders";

type PasswordStrength = "debil" | "media" | "fuerte";

function getPasswordStrength(password: string): { level: PasswordStrength; score: number } {
  let score = 0;
  if (password.length >= 8) {
    score += 1;
  }
  if (/[A-Z]/.test(password)) {
    score += 1;
  }
  if (/[a-z]/.test(password)) {
    score += 1;
  }
  if (/\d/.test(password)) {
    score += 1;
  }
  if (/[^A-Za-z\d]/.test(password)) {
    score += 1;
  }

  if (score <= 2) {
    return { level: "debil", score };
  }

  if (score <= 4) {
    return { level: "media", score };
  }

  return { level: "fuerte", score };
}

function meetsPasswordPolicy(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
}

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "register">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [, setChallengeMessage] = useState("");
  const [expiration, setExpiration] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"credentials" | "challenge">(
    "credentials",
  );

  const [registerName, setRegisterName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

  const navigate = useNavigate();
  const { loading, error, register, login, verify2FA } = useLogin();

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleCredentialsSubmit = async () => {
    try {
      const recaptchaToken = await executeRecaptcha(recaptchaConfig.actions.login);

      const response = await login({
        email: email.trim(),
        password,
        recaptchaToken,
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

  const handleRegisterSubmit = async () => {
    const trimmedName = registerName.trim();
    const trimmedLastName = registerLastName.trim();
    const trimmedEmail = registerEmail.trim();

    if (!trimmedName || !trimmedLastName || !trimmedEmail || !registerPassword || !registerConfirmPassword) {
      toast.error("Completa todos los campos del registro");
      return;
    }

    if (!meetsPasswordPolicy(registerPassword)) {
      toast.error("La contrasena no cumple los requisitos de seguridad");
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      toast.error("La contrasena y su confirmacion no coinciden");
      return;
    }

    try {
      const response = await register({
        name: trimmedName,
        lastName: trimmedLastName,
        email: trimmedEmail,
        password: registerPassword,
        confirmPassword: registerConfirmPassword,
      });

      toast.success(response.message);
      setEmail(trimmedEmail);
      setPassword("");
      setMode("login");
      setRegisterPassword("");
      setRegisterConfirmPassword("");
    } catch (submitError) {
      toast.error((submitError as Error).message);
    }
  };

  const strength = getPasswordStrength(registerPassword);
  const strengthColor =
    strength.level === "debil"
      ? "bg-red-500"
      : strength.level === "media"
        ? "bg-amber-500"
        : "bg-emerald-600";

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
            {mode === "register" ? (
              <form
                className="space-y-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleRegisterSubmit();
                }}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nombre</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Cristian"
                      value={registerName}
                      onChange={(event) => { setRegisterName(event.target.value); }}
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 px-4"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-last-name">Apellido</Label>
                    <Input
                      id="register-last-name"
                      type="text"
                      placeholder="Marin"
                      value={registerLastName}
                      onChange={(event) => { setRegisterLastName(event.target.value); }}
                      className="h-12 rounded-xl border-slate-200 bg-slate-50 px-4"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">Correo electronico</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="correo@ucaldas.edu.co"
                    value={registerEmail}
                    onChange={(event) => { setRegisterEmail(event.target.value); }}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 px-4"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">Contrasena</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="........"
                    value={registerPassword}
                    onChange={(event) => { setRegisterPassword(event.target.value); }}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 px-4"
                  />
                  <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.12em]">
                      <span className="text-slate-500">Fortaleza</span>
                      <span className="font-semibold text-slate-700">{strength.level}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200">
                      <div
                        className={`h-2 rounded-full transition-all ${strengthColor}`}
                        style={{ width: `${Math.max(12, Math.min(100, (strength.score / 5) * 100))}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-600">
                      Minimo 8 caracteres, una mayuscula, una minuscula, un numero y un caracter especial.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">Confirmar contrasena</Label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    placeholder="........"
                    value={registerConfirmPassword}
                    onChange={(event) => { setRegisterConfirmPassword(event.target.value); }}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 px-4"
                  />
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-accent text-base font-medium text-white hover:bg-accent-foreground"
                  disabled={loading}
                >
                  {loading ? "Creando cuenta..." : "Crear cuenta"}
                </Button>

                <p className="text-center text-sm text-slate-600">
                  Ya tienes cuenta?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setPhase("credentials");
                    }}
                    className="font-semibold text-accent underline-offset-4 hover:underline"
                  >
                    Inicia sesion
                  </button>
                </p>
              </form>
            ) : phase === "credentials" ? (
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

                <p className="pt-1 text-center text-sm text-slate-600">
                  No tienes cuenta aca?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("register"); }}
                    className="font-semibold text-accent underline-offset-4 hover:underline"
                  >
                    Crea una
                  </button>
                </p>
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
