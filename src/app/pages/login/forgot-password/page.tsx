import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/security";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const { loading, forgotPassword } = useLogin();

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Ingresa tu correo electronico");
      return;
    }

    try {
      const response = await forgotPassword({ email: trimmedEmail });
      toast.success(response.message);
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
            Recuperar contrasena
          </CardTitle>
          <p className="text-sm text-slate-600">
            Te enviaremos instrucciones al correo registrado para restablecer tu acceso.
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Correo electronico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => { setEmail(event.target.value); }}
                placeholder="correo@ucaldas.edu.co"
                className="h-12 rounded-xl border-slate-200 bg-slate-50 px-4"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-accent text-base font-medium text-white hover:bg-accent-foreground"
            >
              {loading ? "Enviando..." : "Enviar instrucciones"}
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
