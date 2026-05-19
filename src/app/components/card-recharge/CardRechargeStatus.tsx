import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock3, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCardRecharge } from '@/hooks/business/useCardRecharge';
import {
  clearCardRechargeReturnTo,
  resolveCardRechargeReturnTo,
  resolvePaymentReference,
} from '@/lib/card-recharge-return';
import { formatCop } from '@/lib/currency';
import { cn } from '@/lib/utils';

function resolveReference(
  routeReference: string | undefined,
  searchParams: URLSearchParams,
): string {
  const fromRoute = routeReference?.trim();
  if (fromRoute) {
    return fromRoute;
  }
  return resolvePaymentReference(searchParams);
}

function statusLabel(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === 'approved' || normalized === 'aceptada' || normalized === 'accepted') {
    return 'Pago aprobado';
  }
  if (normalized === 'pending' || normalized === 'pendiente') {
    return 'Pago pendiente';
  }
  if (normalized === 'rejected' || normalized === 'rechazada') {
    return 'Pago rechazado';
  }
  if (normalized === 'failed' || normalized === 'fallida') {
    return 'Pago fallido';
  }
  if (normalized === 'cancelled' || normalized === 'cancelada') {
    return 'Pago cancelado';
  }
  return 'Estado de la recarga';
}

function StatusIcon({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  if (normalized === 'approved' || normalized === 'aceptada' || normalized === 'accepted') {
    return <CheckCircle2 className="size-10 text-emerald-600" />;
  }
  if (normalized === 'pending' || normalized === 'pendiente') {
    return <Clock3 className="size-10 text-amber-600" />;
  }
  return <XCircle className="size-10 text-destructive" />;
}

export function CardRechargeStatus() {
  const navigate = useNavigate();
  const { reference: routeReference } = useParams<{ reference?: string }>();
  const [searchParams] = useSearchParams();
  const reference = resolveReference(routeReference, searchParams);
  const returnTo = resolveCardRechargeReturnTo(searchParams.get('returnTo'));
  const hasRedirected = useRef(false);
  const [statusChecked, setStatusChecked] = useState(false);

  const {
    transactionStatus,
    loadingStatus,
    error,
    loadTransactionStatus,
  } = useCardRecharge();

  useEffect(() => {
    if (!reference) {
      return;
    }

    void loadTransactionStatus(reference)
      .catch(() => undefined)
      .finally(() => {
        setStatusChecked(true);
      });
  }, [loadTransactionStatus, reference]);

  useEffect(() => {
    if (!reference || !statusChecked || hasRedirected.current) {
      return;
    }

    hasRedirected.current = true;
    clearCardRechargeReturnTo();
    void navigate(returnTo, {
      replace: true,
      state: { paymentReference: reference },
    });
  }, [navigate, reference, returnTo, statusChecked]);

  if (!reference) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Referencia no encontrada</CardTitle>
          <CardDescription>
            No recibimos la referencia de la transacción. Vuelve a intentar la recarga.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/app/card-recharge">Ir a recargar tarjeta</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const status = transactionStatus?.status ?? 'pending';

  if (reference && !statusChecked) {
    return (
      <Card className="mx-auto w-full max-w-lg">
        <CardContent className="flex flex-col items-center gap-3 py-12">
          <Loader2 className="size-10 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Confirmando pago… volviendo a la página anterior
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader className="items-center text-center">
        <StatusIcon status={status} />
        <CardTitle>{statusLabel(status)}</CardTitle>
        <CardDescription>
          Referencia: <span className="font-mono text-foreground">{reference}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {transactionStatus ? (
          <div
            className={cn(
              'space-y-2 rounded-lg border bg-muted/30 px-4 py-3 text-sm',
            )}
          >
            {transactionStatus.rechargeAmount !== undefined ? (
              <p>
                <span className="font-medium">Monto recargado:</span>{' '}
                {formatCop(transactionStatus.rechargeAmount)}
              </p>
            ) : null}
            {transactionStatus.totalPaid !== undefined ? (
              <p>
                <span className="font-medium">Total pagado:</span>{' '}
                {formatCop(transactionStatus.totalPaid)}
              </p>
            ) : null}
            {transactionStatus.commission !== undefined && transactionStatus.commission > 0 ? (
              <p>
                <span className="font-medium">Comisión ePayco:</span>{' '}
                {formatCop(transactionStatus.commission)}
              </p>
            ) : null}
            {transactionStatus.balanceAfter !== undefined ? (
              <p>
                <span className="font-medium">Saldo después de recarga:</span>{' '}
                {formatCop(transactionStatus.balanceAfter)}
              </p>
            ) : null}
            {transactionStatus.cardLabel ? (
              <p>
                <span className="font-medium">Tarjeta:</span> {transactionStatus.cardLabel}
              </p>
            ) : null}
            {transactionStatus.message ? (
              <p className="text-muted-foreground">{transactionStatus.message}</p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={loadingStatus}
            onClick={() => {
              void loadTransactionStatus(reference).catch(() => undefined);
            }}
          >
            Actualizar estado
          </Button>
          <Button asChild className="flex-1">
            <Link to={returnTo}>Volver</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
