import type { MassAlertStats } from "@/core/types/alerts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MassAlertStatsDialogProps {
  open: boolean;
  loading: boolean;
  stats: MassAlertStats | null;
  alertTitle?: string;
  onOpenChange: (open: boolean) => void;
}

export function MassAlertStatsDialog({
  open,
  loading,
  stats,
  alertTitle,
  onOpenChange,
}: MassAlertStatsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Estadísticas de lectura</DialogTitle>
          <DialogDescription>
            {alertTitle ? `"${alertTitle}"` : "Métricas de entrega y lectura"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando estadísticas...</p>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Destinatarios" value={stats.totalRecipients} />
            <StatCard label="Entregados" value={stats.deliveredCount} />
            <StatCard label="Leídos" value={stats.readCount} />
            <StatCard label="Sin leer" value={stats.unreadCount} />
            <div className="col-span-2 rounded-lg border bg-accent/30 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Porcentaje de lectura</p>
              <p className="mt-1 text-3xl font-semibold text-primary">{stats.readPercentage}%</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No hay estadísticas disponibles.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border px-3 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}
