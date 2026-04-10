import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLogin } from "@/hooks/security";

export default function GithubCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasProcessed = useRef(false);
  const { completeGithubRegistration, loading, loginWithGithub } = useLogin();

  const [error, setError] = useState<string | null>(null);
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (hasProcessed.current) {
      return;
    }

    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      setError("No se recibieron los parametros de GitHub.");
      return;
    }

    hasProcessed.current = true;

    const processGithubCallback = async () => {
      try {
        setError(null);
        const result = await loginWithGithub({ code, state });

        if (result.status === "AUTHENTICATED") {
          toast.success(result.message || "Inicio de sesion con GitHub completado");
          void navigate("/app");
          return;
        }

        if (result.status === "EMAIL_REQUIRED" && result.registrationToken) {
          setRegistrationToken(result.registrationToken);
          toast.info("GitHub no compartio un correo verificable. Completa tu email.");
          return;
        }

        setError(result.message || "No fue posible completar el login con GitHub.");
      } catch (callbackError) {
        const message = callbackError instanceof Error
          ? callbackError.message
          : "Error al procesar callback de GitHub.";
        setError(message);
      }
    };

    void processGithubCallback();
  }, [loginWithGithub, navigate, searchParams]);

  const handleCompleteRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!registrationToken) {
      setError("No se encontro token de registro para completar la autenticacion.");
      return;
    }

    try {
      setError(null);
      const result = await completeGithubRegistration({
        registrationToken,
        email: email.trim(),
      });

      if (result.status === "AUTHENTICATED") {
        toast.success(result.message || "Registro con GitHub completado");
        void navigate("/app");
        return;
      }

      setError(result.message || "No se pudo completar el registro con GitHub.");
    } catch (registrationError) {
      const message = registrationError instanceof Error
        ? registrationError.message
        : "Error al completar registro con GitHub.";
      setError(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md rounded-2xl border-slate-200">
        <CardHeader>
          <CardTitle className="text-2xl text-slate-900">Autenticando con GitHub</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {!registrationToken && !error && (
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="size-4 animate-spin" />
              Procesando callback de GitHub...
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle className="size-4" />
                Ocurrio un error
              </div>
              <p className="mt-1">{error}</p>
              <Link className="mt-3 inline-block text-sm font-medium text-red-700 underline" to="/login">
                Volver al login
              </Link>
            </div>
          )}

          {registrationToken && (
            <form className="space-y-4" onSubmit={(event) => {
              void handleCompleteRegistration(event);
            }}>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Tu cuenta de GitHub no expone un email publico verificable. Ingresa un correo para terminar el registro.
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electronico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@correo.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                  }}
                  className="h-11"
                  required
                />
              </div>

              <Button className="h-11 w-full" disabled={loading} type="submit">
                {loading ? "Completando..." : "Completar registro"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
