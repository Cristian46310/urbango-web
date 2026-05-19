import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useCardRecharge } from '@/hooks/business/useCardRecharge';
import {
  clearCardRechargeReturnTo,
  clearPendingCheckoutSession,
  getPendingStatusPollUrl,
  resolveCardRechargeReturnTo,
  resolvePaymentReference,
} from '@/lib/card-recharge-return';

/**
 * Landing page after ePayco redirects the user (botón Finalizar / response URL).
 * Consulta el estado y vuelve a la pantalla donde inició el pago.
 */
export function CardRechargeReturn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasHandled = useRef(false);
  const { finalizePaymentReturn } = useCardRecharge();

  useEffect(() => {
    if (hasHandled.current) {
      return;
    }
    hasHandled.current = true;

    const returnTo = resolveCardRechargeReturnTo(searchParams.get('returnTo'));
    const reference = resolvePaymentReference(searchParams);

    const statusPollUrl = getPendingStatusPollUrl();

    const goBack = (paymentState?: {
      paymentReference?: string;
      paymentHandled?: boolean;
    }) => {
      clearCardRechargeReturnTo();
      void navigate(returnTo, {
        replace: true,
        state: paymentState ?? null,
      });
    };

    if (!reference && !statusPollUrl) {
      clearPendingCheckoutSession();
      goBack();
      return;
    }

    void finalizePaymentReturn({ reference, statusPollUrl })
      .catch(() => undefined)
      .finally(() => {
        clearPendingCheckoutSession();
        goBack({
          paymentReference: reference || undefined,
          paymentHandled: true,
        });
      });
  }, [finalizePaymentReturn, navigate, searchParams]);

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardContent className="flex flex-col items-center gap-3 py-12">
        <Loader2 className="size-10 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Consultando estado del pago y actualizando saldo…
        </p>
      </CardContent>
    </Card>
  );
}
