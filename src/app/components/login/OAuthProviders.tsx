import { useEffect, useState } from "react";
import type { SVGProps } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { useLogin } from "@/hooks/security";

function GithubMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
      {...props}
    >
      <path d="M12 .3a12 12 0 0 0-3.79 23.39c.6.1.82-.26.82-.58v-2.03c-3.34.72-4.04-1.42-4.04-1.42a3.18 3.18 0 0 0-1.33-1.76c-1.09-.74.08-.72.08-.72a2.53 2.53 0 0 1 1.84 1.25 2.57 2.57 0 0 0 3.5 1 2.57 2.57 0 0 1 .77-1.62c-2.66-.3-5.47-1.34-5.47-5.95a4.67 4.67 0 0 1 1.24-3.24 4.35 4.35 0 0 1 .12-3.2s1.01-.32 3.3 1.23a11.4 11.4 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23a4.35 4.35 0 0 1 .12 3.2 4.66 4.66 0 0 1 1.24 3.24c0 4.62-2.82 5.65-5.5 5.95a2.87 2.87 0 0 1 .82 2.22v3.3c0 .32.21.69.83.57A12 12 0 0 0 12 .3" />
    </svg>
  );
}

function MicrosoftMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
      {...props}
    >
      <path d="M2 2h9v9H2z" />
      <path d="M13 2h9v9h-9z" />
      <path d="M2 13h9v9H2z" />
      <path d="M13 13h9v9h-9z" />
    </svg>
  );
}

export function OAuthProviders() {
  const navigate = useNavigate();
  const { error, authorizeGithubLogin, authorizeMicrosoftLogin, loginWithGoogle } = useLogin();
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  const handleGoogleSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
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
      const message =
        err instanceof Error ? err.message : "Error en login con Google";
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
      const message =
        err instanceof Error ? err.message : "Error en login con GitHub";
      setLocalError(message);
      toast.error(message);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      setLocalError(null);
      const response = await authorizeMicrosoftLogin();
      window.location.href = response.authorizationUrl;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error en login con Microsoft";
      setLocalError(message);
      toast.error(message);
    }
  };

  return (
    <div className="space-y-4">
      {localError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {localError}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              void handleGoogleSuccess(credentialResponse);
            }}
            onError={handleGoogleError}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          onClick={() => {
            void handleGithubLogin();
          }}
        >
          <GithubMark className="mr-2 size-4" />
          Continuar con GitHub
        </Button>

        <Button
          type="button"
          variant="outline"
          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          onClick={() => {
            void handleMicrosoftLogin();
          }}
        >
          <MicrosoftMark className="mr-2 size-4" />
          Continuar con Microsoft
        </Button>
      </div>
    </div>
  );
}
