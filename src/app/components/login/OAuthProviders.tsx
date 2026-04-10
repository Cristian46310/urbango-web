import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Github } from "lucide-react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { useLogin } from "@/hooks/security";

export function OAuthProviders() {
  const navigate = useNavigate();
  const { error, authorizeGithubLogin, loginWithGoogle } = useLogin();
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setLocalError(null);
      
      if (!credentialResponse.credential) {
        throw new Error("No credential received from Google");
      }

      // Enviar el idToken al backend
      await loginWithGoogle({
        idToken: credentialResponse.credential,
      });

      toast.success("Inicio de sesión con Google completado");
      void navigate("/app");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error en login con Google";
      setLocalError(message);
      toast.error(message);
    }
  };

  const handleGoogleError = () => {
    const message = "Error al iniciar sesión con Google";
    setLocalError(message);
    toast.error(message);
  };

  const handleGithubLogin = async () => {
    try {
      setLocalError(null);
      const response = await authorizeGithubLogin();
      window.location.href = response.authorizationUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error en login con GitHub";
      setLocalError(message);
      toast.error(message);
    }
  };

  return (
    <div className="space-y-3">
      {localError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {localError}
        </div>
      )}
      
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
        />
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        onClick={() => {
          void handleGithubLogin();
        }}
      >
        <Github className="mr-2 size-4" />
        Continuar con GitHub
      </Button>
    </div>
  );
}
