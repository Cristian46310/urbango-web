import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  Plus,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageShell } from '@/app/components/security/page-shell';
import type { PaymentMethod, PaymentMethodCode } from '@/core/domain/entities/business';
import {
  myPaymentMethodCitizenRepository,
  type CitizenPaymentMethodOption,
} from '@/infra/repository/paymentMethodCitizen';
import { cardRechargeRepository } from '@/infra/repository/cardRecharge';
import type { RechargeableCard } from '@/core/domain/entities/business/CardRecharge';
import { useCitizenProfile } from '@/hooks/useCitizenProfile';
import { formatCop } from '@/lib/currency';
import { getApiErrorMessage } from '@/lib/api-error';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import { cn } from '@/lib/utils';

function isRechargeableMethod(method: PaymentMethod): boolean {
  if (typeof method.isRechargeable === 'boolean') {
    return method.isRechargeable;
  }
  return method.code === 'SYSTEM_CARD';
}

function MethodIcon({ code }: { code?: PaymentMethodCode }) {
  if (code === 'CASH') {
    return <Banknote className="size-5 text-emerald-700" aria-hidden />;
  }
  if (code === 'EXTERNAL_CARD') {
    return <CreditCard className="size-5 text-slate-700" aria-hidden />;
  }
  return <Wallet className="size-5 text-teal-700" aria-hidden />;
}

function methodHint(code?: PaymentMethodCode): string {
  if (code === 'CASH') {
    return 'Pago en efectivo al abordar. No maneja saldo digital.';
  }
  if (code === 'EXTERNAL_CARD') {
    return 'Tarjeta crédito/débito externa. Sin saldo del sistema.';
  }
  if (code === 'SYSTEM_CARD') {
    return 'Tarjeta del sistema con saldo recargable.';
  }
  return 'Método disponible en el catálogo.';
}

export function CitizenPaymentMethodsView() {
  const { hasCitizenProfile, loading: loadingProfile } = useCitizenProfile();
  const [catalog, setCatalog] = useState<PaymentMethod[]>([]);
  const [links, setLinks] = useState<CitizenPaymentMethodOption[]>([]);
  const [cards, setCards] = useState<RechargeableCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [registeringCard, setRegisteringCard] = useState(false);

  const linksByMethodId = useMemo(() => {
    const map = new Map<string, CitizenPaymentMethodOption>();
    for (const link of links) {
      if (link.paymentMethodId) {
        map.set(link.paymentMethodId, link);
      }
    }
    return map;
  }, [links]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [catalogItems, mine] = await Promise.all([
        myPaymentMethodCitizenRepository.listCatalog(),
        myPaymentMethodCitizenRepository.listMine(),
      ]);
      setCatalog(catalogItems);
      setLinks(mine);

      const hasSystem = mine.some(
        (item) => item.code === 'SYSTEM_CARD' || item.isRechargeable,
      );
      if (hasSystem) {
        const listed = await cardRechargeRepository.listCards().catch(() => []);
        setCards(listed);
      } else {
        setCards([]);
      }
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, 'No se pudieron cargar los métodos de pago'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasCitizenProfile !== true) {
      setLoading(false);
      return;
    }
    void loadAll();
  }, [hasCitizenProfile, loadAll]);

  const handleLink = async (paymentMethodId: string) => {
    setLinkingId(paymentMethodId);
    try {
      await myPaymentMethodCitizenRepository.linkMine({ paymentMethodId });
      showSuccessToast('Método de pago vinculado');
      await loadAll();
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, 'No se pudo vincular el método'));
    } finally {
      setLinkingId(null);
    }
  };

  const handleRegisterCard = async () => {
    setRegisteringCard(true);
    try {
      await cardRechargeRepository.registerCard({});
      showSuccessToast('Tarjeta del sistema registrada');
      const listed = await cardRechargeRepository.listCards();
      setCards(listed);
    } catch (error) {
      showErrorToast(getApiErrorMessage(error, 'No se pudo registrar la tarjeta'));
    } finally {
      setRegisteringCard(false);
    }
  };

  if (loadingProfile || (loading && hasCitizenProfile === true)) {
    return (
      <div className="flex min-h-[280px] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Cargando métodos de pago…
      </div>
    );
  }

  if (hasCitizenProfile === false) {
    return (
      <Card className="mx-auto max-w-2xl border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-lg text-amber-950">Perfil ciudadano requerido</CardTitle>
          <CardDescription className="text-amber-900">
            Debes completar tu perfil de ciudadano antes de vincular métodos de pago.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/app/register-profile">Completar perfil ciudadano</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-4">
      {catalog.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No hay métodos de pago en el catálogo todavía.
          </CardContent>
        </Card>
      ) : (
        catalog.map((method) => {
          const link = linksByMethodId.get(method.id);
          const linked = Boolean(link);
          const rechargeable = isRechargeableMethod(method);
          const linking = linkingId === method.id;

          return (
            <Card
              key={method.id}
              className={cn(
                'border shadow-sm transition-colors',
                linked
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : 'border-(--security-border)',
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-lg border bg-white p-2 shadow-xs">
                      <MethodIcon code={method.code} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{method.name}</CardTitle>
                      <CardDescription>{methodHint(method.code)}</CardDescription>
                    </div>
                  </div>
                  {linked ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-900">
                      <CheckCircle2 className="size-3.5" />
                      Vinculado
                    </span>
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                      Sin vincular
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {linked && method.code === 'SYSTEM_CARD' ? (
                  <div className="rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm">
                    <p className="text-muted-foreground">Saldo actual</p>
                    <p className="text-xl font-semibold tabular-nums text-[#1a1a1a]">
                      {formatCop(link?.balance ?? cards[0]?.balance ?? 0)}
                    </p>
                  </div>
                ) : null}

                {!linked ? (
                  <Button
                    type="button"
                    className="w-full sm:w-auto"
                    disabled={linking}
                    onClick={() => void handleLink(method.id)}
                  >
                    {linking ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Vinculando…
                      </>
                    ) : (
                      'Vincular'
                    )}
                  </Button>
                ) : null}

                {linked && rechargeable ? (
                  <div className="space-y-3 rounded-xl border border-dashed border-teal-300 bg-teal-50/50 p-3">
                    <p className="text-sm font-medium text-teal-950">Recarga (tarjeta del sistema)</p>
                    {cards.length === 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Aún no tienes una tarjeta del sistema registrada.
                        </p>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={registeringCard}
                          onClick={() => void handleRegisterCard()}
                        >
                          {registeringCard ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Registrando…
                            </>
                          ) : (
                            <>
                              <Plus className="size-4" />
                              Registrar tarjeta
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <ul className="space-y-1.5 text-sm">
                          {cards.map((card) => (
                            <li
                              key={card.id}
                              className="flex items-center justify-between rounded-md border bg-white px-3 py-2"
                            >
                              <span>{card.label}</span>
                              <span className="font-medium tabular-nums">
                                {formatCop(card.balance)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <Button asChild className="w-full sm:w-auto">
                          <Link to="/app/card-recharge">Recargar</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

export default function CitizenPaymentMethodsPage() {
  return (
    <PageShell
      title="Métodos de pago"
      description="Vincula los métodos del catálogo a tu perfil. La recarga solo aplica a la tarjeta del sistema."
    >
      <CitizenPaymentMethodsView />
    </PageShell>
  );
}
