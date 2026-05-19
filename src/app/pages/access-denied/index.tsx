import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export function AccessDeniedPage() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="w-16 h-16 text-red-600" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Acceso Denegado</h1>
        <p className="text-slate-600 text-lg mb-6">
          No tienes permisos para acceder a esta página. Si crees que es un error, contacta al administrador.
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => {
              void navigate('/app');
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Ir al Dashboard
          </Button>
          <Button
            onClick={() => {
              void navigate(-1);
            }}
            variant="outline"
          >
            Volver Atrás
          </Button>
        </div>
      </div>
    </div>
  );
}
