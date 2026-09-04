import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recaptchaConfig } from "@/config/recaptcha";
import { useLogin } from "@/hooks/security";
import { executeRecaptcha } from "@/lib/recaptcha";

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
      const recaptchaToken = await executeRecaptcha(
        recaptchaConfig.actions.forgotPassword,
      );
      const response = await forgotPassword({
        email: trimmedEmail,
        recaptchaToken,
      });
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
          "linear-gradient(145deg, color-mix(in oklab, var(--primary) 28%, white 72%) 0%, color-mix(in oklab, var(--background) 80%, var(--primary) 20%) 45%, var(--background) 100%)",
      }}
    >
      <Card
        className="w-full max-w-lg rounded-3xl border border-(--security-border) bg-white/95 backdrop-blur"
        style={{
          boxShadow: "0 24px 80px color-mix(in oklab, var(--primary) 18%, transparent)",
        }}
      >
        <CardHeader className="space-y-2 pb-2">
          <p className="text-sm font-semibold tracking-[0.08em] text-teal-800 uppercase">
            urbanGO
          </p>
          <CardTitle className="text-3xl font-semibold tracking-tight text-slate-900">
            Recuperar contraseña
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
                placeholder="correo@ejemplo.com"
                className="h-12 rounded-xl border-slate-200 bg-slate-50 px-4"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl text-base font-medium"
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
