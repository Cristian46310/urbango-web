import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/security";

function meetsPasswordPolicy(password: string): boolean {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();
  const { loading, resetPassword } = useLogin();

  const hasToken = token.length > 0;

  const handleSubmit = async () => {
    if (!hasToken) {
      toast.error("El token de recuperacion es obligatorio");
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error("Completa los campos de contrasena");
      return;
    }

    if (!meetsPasswordPolicy(newPassword)) {
      toast.error("La contrasena no cumple con los requisitos de seguridad");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("La contrasena y la confirmacion no coinciden");
      return;
    }

    try {
      const response = await resetPassword({ token, newPassword });
      toast.success(response.message);
      void navigate("/login", { replace: true });
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8"
      style={{
        backgroundImage:
          "linear-gradient(145deg, color-mix(in oklab, var(--accent) 52%, black 6%) 0%, color-mix(in oklab, var(--accent) 34%, white 12%) 50%, #f6ece2 100%)",
      }}
    >
      <Card className="w-full max-w-lg rounded-3xl border-0 bg-white/95 shadow-[0_24px_80px_rgba(88,48,124,0.18)] backdrop-blur">
        <CardHeader className="space-y-2 pb-2">
          <CardTitle className="text-3xl font-semibold tracking-tight text-slate-900">
            Restablecer contrasena
          </CardTitle>
          <p className="text-sm text-slate-600">
            Ingresa una nueva contrasena para completar el proceso.
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          {!hasToken ? (
            <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-medium">No se encontro un token valido en la URL.</p>
              <p>Solicita nuevamente la recuperacion desde la pantalla de inicio de sesion.</p>
            </div>
          ) : null}

          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contrasena</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => { setNewPassword(event.target.value); }}
                placeholder="........"
                className="h-12 rounded-xl border-slate-200 bg-slate-50 px-4"
              />
              <p className="text-xs text-slate-500">
                Minimo 8 caracteres, incluyendo mayuscula, minuscula, numero y simbolo.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar contrasena</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => { setConfirmPassword(event.target.value); }}
                placeholder="........"
                className="h-12 rounded-xl border-slate-200 bg-slate-50 px-4"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !hasToken}
              className="h-12 w-full rounded-xl bg-accent text-base font-medium text-white hover:bg-accent-foreground"
            >
              {loading ? "Actualizando..." : "Actualizar contrasena"}
            </Button>
          </form>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 underline-offset-4 hover:underline"
          >
            <ArrowLeft className="size-4" />
            Volver al inicio de sesion
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
