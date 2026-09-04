import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Loader2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCardRecharge } from '@/hooks/business/useCardRecharge';
import { useCitizenProfile } from '@/hooks/useCitizenProfile';
import { cardRechargeRepository } from '@/infra/repository/cardRecharge';
import { formatCop } from '@/lib/currency';
import { getApiErrorMessage } from '@/lib/api-error';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import {
  buildEpaycoResponseUrl,
  clearCardRechargeReturnTo,
  clearPendingCheckoutSession,
  resolveCardRechargeReturnTo,
  saveCardRechargeReturnTo,
  savePendingCheckoutReference,
  savePendingStatusPollUrl,
} from '@/lib/card-recharge-return';
import { openEpaycoCheckout } from '@/lib/epayco';
import { cn } from '@/lib/utils';

const FALLBACK_AMOUNTS = [10_000, 20_000, 50_000, 100_000];
const FALLBACK_MIN = 5_000;
const FALLBACK_MAX = 500_000;

function parseAmountInput(value: string): number | null {
  const digits = value.replace(/\D/g, '');
  if (!digits) {
    return null;
  }
  return Number(digits);
}

interface PaymentReturnState {
  paymentReference?: string;
  paymentHandled?: boolean;
}

function RegisterSystemCardButton({ onRegistered }: { onRegistered: () => void }) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="button"
      disabled={loading}
      onClick={() => {
        void (async () => {
          setLoading(true);
          try {
            await cardRechargeRepository.registerCard({});
            showSuccessToast('Tarjeta del sistema registrada');
            onRegistered();
          } catch (error) {
            showErrorToast(getApiErrorMessage(error, 'No se pudo registrar la tarjeta'));
          } finally {
            setLoading(false);
          }
        })();
      }}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Registrando…
        </>
      ) : (
        'Registrar tarjeta del sistema'
      )}
    </Button>
  );
}

export function CardRechargeForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasCitizenProfile, loading: loadingCitizenProfile } = useCitizenProfile();
  const {
    config,
    cards,
    preview,
    loadingInitial,
    loadingPreview,
    loadingCheckout,
    error,
    loadInitialData,
    loadPreview,
    clearPreview,
    startCheckout,
    finalizePaymentReturn,
  } = useCardRecharge();

  const [selectedCardId, setSelectedCardId] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmountInput, setCustomAmountInput] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);

  const minAmount = config?.minAmount ?? FALLBACK_MIN;
  const maxAmount = config?.maxAmount ?? FALLBACK_MAX;
  const presetAmounts = config?.predefinedAmounts ?? FALLBACK_AMOUNTS;

  const selectedCard = useMemo(
    () => cards.find((card) => card.id === selectedCardId) ?? null,
    [cards, selectedCardId],
  );

  const rechargeAmount = useMemo(() => {
    if (selectedPreset !== null) {
      return selectedPreset;
    }
    return parseAmountInput(customAmountInput);
  }, [customAmountInput, selectedPreset]);

  useEffect(() => {
    if (hasCitizenProfile !== true) {
      return;
    }
    void loadInitialData();
  }, [hasCitizenProfile, loadInitialData]);

  useEffect(() => {
    if (!selectedCardId && cards.length > 0) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards, selectedCardId]);

  useEffect(() => {
    if (!selectedCardId || rechargeAmount === null) {
      clearPreview();
      return;
    }

    if (rechargeAmount < minAmount || rechargeAmount > maxAmount) {
      setAmountError(
        `El monto debe estar entre ${formatCop(minAmount)} y ${formatCop(maxAmount)}`,
      );
      clearPreview();
      return;
    }

    setAmountError(null);

    const timeoutId = window.setTimeout(() => {
      void loadPreview(selectedCardId, rechargeAmount).catch(() => undefined);
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    clearPreview,
    loadPreview,
    maxAmount,
    minAmount,
    rechargeAmount,
    selectedCardId,
  ]);

  const handlePresetClick = (amount: number) => {
    setSelectedPreset(amount);
    setCustomAmountInput('');
    setAmountError(null);
  };

  const handleCustomAmountChange = (value: string) => {
    setSelectedPreset(null);
    setCustomAmountInput(value);
  };

  const handleContinueToPayment = async () => {
    if (!selectedCardId || rechargeAmount === null) {
      setAmountError('Selecciona una tarjeta y un monto válido');
      return;
    }

    if (rechargeAmount < minAmount || rechargeAmount > maxAmount) {
      setAmountError(
        `El monto debe estar entre ${formatCop(minAmount)} y ${formatCop(maxAmount)}`,
      );
      return;
    }

    const returnTo = `${location.pathname}${location.search}`;
    saveCardRechargeReturnTo(returnTo);
    const responseUrl = buildEpaycoResponseUrl(returnTo);

    try {
      const checkout = await startCheckout(
        selectedCardId,
        rechargeAmount,
        responseUrl,
      );

      savePendingCheckoutReference(checkout.reference);
      savePendingStatusPollUrl(checkout.statusPollUrl);

      const navigateBack = () => {
        const target = resolveCardRechargeReturnTo(returnTo);
        void (async () => {
          try {
            await finalizePaymentReturn({
              reference: checkout.reference,
              statusPollUrl: checkout.statusPollUrl,
            });
          } catch {
            // El store ya notifica el error.
          } finally {
            clearCardRechargeReturnTo();
            clearPendingCheckoutSession();
            void navigate(target, {
              replace: true,
              state: {
                paymentReference: checkout.reference,
                paymentHandled: true,
              } satisfies PaymentReturnState,
            });
          }
        })();
      };

      await openEpaycoCheckout({
        sessionId: checkout.sessionId,
        type: 'onpage',
        test: checkout.test ?? config?.epaycoTestMode ?? true,
        onError: navigateBack,
        onClosed: navigateBack,
      });
    } catch {
      // Errors are handled in the store.
    }
  };

  const currentBalance = preview?.currentBalance ?? selectedCard?.balance ?? 0;
  const balanceAfter = preview?.balanceAfterRecharge ?? currentBalance + (rechargeAmount ?? 0);
  const canContinue =
    Boolean(selectedCardId) &&
    rechargeAmount !== null &&
    rechargeAmount >= minAmount &&
    rechargeAmount <= maxAmount &&
    !loadingCheckout &&
    !loadingPreview;

  if (loadingCitizenProfile) {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Verificando perfil de ciudadano...
      </div>
    );
  }

  if (hasCitizenProfile === false) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Recargar tarjeta</h1>
        </div>
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-lg text-amber-950">Perfil ciudadano requerido</CardTitle>
            <CardDescription className="text-amber-900">
              Debe registrar su perfil de ciudadano antes de usar pagos o recargas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/app/register-profile">Completar perfil ciudadano</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingInitial && cards.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Cargando recarga de tarjeta...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Recargar tarjeta</h1>
        <p className="text-sm text-muted-foreground">
          Recarga saldo con ePayco (tarjeta, PSE, efectivo y más). Los datos de pago
          se procesan de forma segura en ePayco.
        </p>
      </div>

      {error && cards.length === 0 ? (
        <Card className="border-destructive/40">
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {cards.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="size-5" />
              Sin tarjetas recargables
            </CardTitle>
            <CardDescription>
              Vincula la tarjeta del sistema en Métodos de pago o regístrala aquí
              para poder recargar con ePayco.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/app/payment-methods">Ir a métodos de pago</Link>
            </Button>
            <RegisterSystemCardButton onRegistered={() => void loadInitialData()} />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="size-5" />
                Tarjeta a recargar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="card-select">Selecciona tu tarjeta</Label>
                <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                  <SelectTrigger id="card-select" className="w-full">
                    <SelectValue placeholder="Elige una tarjeta" />
                  </SelectTrigger>
                  <SelectContent>
                    {cards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        {card.label} — Saldo: {formatCop(card.balance)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                <p>
                  <span className="font-medium">Saldo actual:</span>{' '}
                  {formatCop(currentBalance)}
                </p>
                <p className="mt-1 text-muted-foreground">
                  <span className="font-medium text-foreground">Saldo después de recarga:</span>{' '}
                  {rechargeAmount !== null && !amountError
                    ? formatCop(balanceAfter)
                    : '—'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monto a recargar</CardTitle>
              <CardDescription>
                Montos entre {formatCop(minAmount)} y {formatCop(maxAmount)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {presetAmounts.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant={selectedPreset === amount ? 'default' : 'outline'}
                    onClick={() => { handlePresetClick(amount); }}
                  >
                    {formatCop(amount)}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-amount">Monto personalizado</Label>
                <Input
                  id="custom-amount"
                  inputMode="numeric"
                  placeholder={`Ej: ${formatCop(15_000)}`}
                  value={customAmountInput}
                  onChange={(event) => { handleCustomAmountChange(event.target.value); }}
                />
                {amountError ? (
                  <p className="text-sm text-destructive">{amountError}</p>
                ) : null}
              </div>

              {preview && preview.commissionApplies ? (
                <div
                  className={cn(
                    'rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950',
                  )}
                >
                  <p className="font-medium">Cargos adicionales por transacción</p>
                  <p className="mt-1">
                    Comisión ePayco: {formatCop(preview.commission)}
                    {preview.commissionLabel ? ` — ${preview.commissionLabel}` : ''}
                  </p>
                  <p className="mt-1">
                    Total a pagar en la pasarela:{' '}
                    <span className="font-semibold">{formatCop(preview.totalToPay)}</span>
                  </p>
                </div>
              ) : preview && !preview.commissionApplies ? (
                <p className="text-sm text-muted-foreground">
                  No aplican cargos adicionales por esta transacción.
                </p>
              ) : null}

              <Button
                type="button"
                className="w-full"
                size="lg"
                disabled={!canContinue}
                onClick={() => { void handleContinueToPayment(); }}
              >
                {loadingCheckout ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Preparando pago...
                  </>
                ) : (
                  'Continuar al pago'
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Al continuar se abrirá el checkout seguro de ePayco. No almacenamos datos
                de tarjetas de crédito o débito.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
