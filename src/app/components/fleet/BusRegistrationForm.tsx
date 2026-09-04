import { useEffect, useId, useMemo, useState } from 'react';
import { Upload, X, Bus as BusIcon, QrCode, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BUS_STATUS_LABELS,
  BUS_STATUS_OPTIONS,
  type Bus,
  type BusStatus,
  type CreateBusDTO,
} from '@/core/domain/entities/business/Bus';
import { useBus } from '@/hooks/business/useBus';
import { cn } from '@/lib/utils';

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const CURRENT_YEAR = new Date().getFullYear();

/** Valor real del usuario vs placeholder tenue. */
const fieldInputClassName =
  'text-[#1a1a1a] placeholder:text-muted-foreground dark:text-foreground';

const STATUS_CHIP_CLASSES: Record<BusStatus, string> = {
  operativo:
    'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 data-[selected=true]:border-emerald-600 data-[selected=true]:bg-emerald-200 data-[selected=true]:ring-2 data-[selected=true]:ring-emerald-400/40',
  mantenimiento:
    'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 data-[selected=true]:border-amber-600 data-[selected=true]:bg-amber-200 data-[selected=true]:ring-2 data-[selected=true]:ring-amber-400/40',
  fuera_de_servicio:
    'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 data-[selected=true]:border-red-500 data-[selected=true]:bg-red-100 data-[selected=true]:text-red-900 data-[selected=true]:ring-2 data-[selected=true]:ring-red-400/40',
};

type FieldErrors = Partial<
  Record<'plate' | 'color' | 'model' | 'year' | 'seatedCapacity' | 'standingCapacity' | 'photo', string>
>;

function parseOptionalInt(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function BusSuccessPanel({
  bus,
  onRegisterAnother,
}: {
  bus: Bus;
  onRegisterAnother: () => void;
}) {
  return (
    <Card className="mx-auto max-w-2xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-900">
          <BusIcon className="size-5" />
          Bus registrado
        </CardTitle>
        <CardDescription className="text-emerald-800">
          Placa <strong>{bus.plate}</strong> — estado{' '}
          <strong>{BUS_STATUS_LABELS[bus.status]}</strong>. El vehículo queda
          disponible para asignar a programaciones
          {bus.status === 'operativo' ? '' : ' cuando pase a operativo'}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {bus.photoUrl ? (
          <img
            src={bus.photoUrl}
            alt={`Foto del bus ${bus.plate}`}
            className="h-40 w-full rounded-lg border object-cover"
          />
        ) : null}

        {bus.qrCode ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border bg-white p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <QrCode className="size-4" />
              Código QR para validaciones rápidas
            </p>
            <img
              src={bus.qrCode}
              alt={`Código QR del bus ${bus.plate}`}
              className="size-48 rounded-md border bg-white p-2"
            />
          </div>
        ) : null}

        <Button type="button" className="w-full" onClick={onRegisterAnother}>
          Registrar otro bus
        </Button>
      </CardContent>
    </Card>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm font-medium text-red-600" role="alert">
      {message}
    </p>
  );
}

export function BusRegistrationForm() {
  const fileInputId = useId();
  const { loading, registerBus, lastRegisteredBus, clearLastRegisteredBus } =
    useBus();

  const [plate, setPlate] = useState('');
  const [color, setColor] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [seatedCapacity, setSeatedCapacity] = useState('');
  const [standingCapacity, setStandingCapacity] = useState('');
  const [status, setStatus] = useState<BusStatus>('operativo');
  const [photo, setPhoto] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const photoPreview = useMemo(
    () => (photo ? URL.createObjectURL(photo) : null),
    [photo],
  );

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const seatedParsed = parseOptionalInt(seatedCapacity);
  const standingParsed = parseOptionalInt(standingCapacity);
  const hasCapacityInput =
    seatedCapacity.trim() !== '' || standingCapacity.trim() !== '';
  const calculatedTotalCapacity =
    (seatedParsed ?? 0) + (standingParsed ?? 0);

  const clearFieldError = (key: keyof FieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const resetForm = () => {
    setPlate('');
    setColor('');
    setModel('');
    setYear(String(CURRENT_YEAR));
    setSeatedCapacity('');
    setStandingCapacity('');
    setStatus('operativo');
    setPhoto(null);
    setFieldErrors({});
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setFieldErrors((prev) => ({
        ...prev,
        photo: 'Solo se permiten imágenes JPEG, PNG o WebP',
      }));
      return;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      setFieldErrors((prev) => ({
        ...prev,
        photo: 'La foto no puede superar 10 MB',
      }));
      return;
    }

    clearFieldError('photo');
    setPhoto(file);
  };

  const validateForm = (): CreateBusDTO | null => {
    const trimmedPlate = plate.trim().toUpperCase();
    const trimmedColor = color.trim();
    const trimmedModel = model.trim();
    const yearValue = Number.parseInt(year, 10);
    const seated = parseOptionalInt(seatedCapacity);
    const standing = parseOptionalInt(standingCapacity);
    const errors: FieldErrors = {};

    if (!trimmedPlate) {
      errors.plate = 'La placa es obligatoria';
    }

    if (!trimmedModel) {
      errors.model = 'El modelo es obligatorio';
    }

    if (!trimmedColor) {
      errors.color = 'El color es obligatorio';
    }

    if (Number.isNaN(yearValue) || yearValue < 1900 || yearValue > CURRENT_YEAR + 1) {
      errors.year = `Indica un año entre 1900 y ${CURRENT_YEAR + 1}`;
    }

    if (seated == null || seated < 0) {
      errors.seatedCapacity = 'Indica la capacidad de pasajeros sentados (0 o más)';
    }

    if (standing == null || standing < 0) {
      errors.standingCapacity = 'Indica la capacidad de pasajeros de pie (0 o más)';
    }

    if (
      seated != null &&
      standing != null &&
      seated >= 0 &&
      standing >= 0 &&
      seated + standing < 1
    ) {
      errors.seatedCapacity = 'La suma de sentados y parados debe ser al menos 1';
      errors.standingCapacity = 'La suma de sentados y parados debe ser al menos 1';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return null;
    }

    return {
      plate: trimmedPlate,
      color: trimmedColor,
      model: trimmedModel,
      year: yearValue,
      seatedCapacity: seated!,
      standingCapacity: standing!,
      status,
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = validateForm();
    if (!payload) {
      return;
    }

    try {
      await registerBus(payload, photo);
      resetForm();
    } catch {
      // Toast de error lo dispara el store (showErrorToast)
    }
  };

  if (lastRegisteredBus) {
    return (
      <BusSuccessPanel
        bus={lastRegisteredBus}
        onRegisterAnother={() => {
          clearLastRegisteredBus();
        }}
      />
    );
  }

  return (
    <Card className="mx-auto max-w-2xl border border-(--security-border) shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BusIcon className="size-5" />
          Datos del bus
        </CardTitle>
        <CardDescription className="space-y-2 text-pretty">
          <span className="block">
            El bus se asocia automáticamente a tu empresa con la sesión actual.
          </span>
          <span className="flex items-start gap-2">
            <QrCode className="mt-0.5 size-4 shrink-0 text-slate-600" aria-hidden />
            <span>
              Al guardar se genera un código QR único para validaciones rápidas.
            </span>
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="grid gap-4"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="bus-plate">Placa (única)</Label>
              <Input
                id="bus-plate"
                value={plate}
                onChange={(event) => {
                  setPlate(event.target.value);
                  clearFieldError('plate');
                }}
                placeholder="ABC-123"
                disabled={loading}
                autoComplete="off"
                maxLength={8}
                aria-invalid={Boolean(fieldErrors.plate)}
                className={cn('uppercase', fieldInputClassName)}
              />
              <FieldError message={fieldErrors.plate} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bus-color">Color</Label>
              <Input
                id="bus-color"
                value={color}
                onChange={(event) => {
                  setColor(event.target.value);
                  clearFieldError('color');
                }}
                placeholder="Blanco"
                disabled={loading}
                aria-invalid={Boolean(fieldErrors.color)}
                className={fieldInputClassName}
              />
              <FieldError message={fieldErrors.color} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bus-model">Modelo</Label>
              <Input
                id="bus-model"
                value={model}
                onChange={(event) => {
                  setModel(event.target.value);
                  clearFieldError('model');
                }}
                placeholder="Mercedes-Benz O500"
                disabled={loading}
                aria-invalid={Boolean(fieldErrors.model)}
                className={fieldInputClassName}
              />
              <FieldError message={fieldErrors.model} />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="bus-year">Año</Label>
              <Input
                id="bus-year"
                type="number"
                min={1900}
                max={CURRENT_YEAR + 1}
                value={year}
                onChange={(event) => {
                  setYear(event.target.value);
                  clearFieldError('year');
                }}
                disabled={loading}
                aria-invalid={Boolean(fieldErrors.year)}
                className={fieldInputClassName}
              />
              <FieldError message={fieldErrors.year} />
            </div>

            <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <p className="mb-3 text-sm font-medium text-slate-800 dark:text-slate-100">
                Capacidad de pasajeros
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="bus-seated">Capacidad sentados</Label>
                  <Input
                    id="bus-seated"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={seatedCapacity}
                    onChange={(event) => {
                      setSeatedCapacity(event.target.value);
                      clearFieldError('seatedCapacity');
                    }}
                    placeholder="Ej. 40"
                    disabled={loading}
                    aria-invalid={Boolean(fieldErrors.seatedCapacity)}
                    className={fieldInputClassName}
                  />
                  <FieldError message={fieldErrors.seatedCapacity} />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bus-standing">Capacidad parados</Label>
                  <Input
                    id="bus-standing"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={standingCapacity}
                    onChange={(event) => {
                      setStandingCapacity(event.target.value);
                      clearFieldError('standingCapacity');
                    }}
                    placeholder="Ej. 20"
                    disabled={loading}
                    aria-invalid={Boolean(fieldErrors.standingCapacity)}
                    className={fieldInputClassName}
                  />
                  <FieldError message={fieldErrors.standingCapacity} />
                </div>
              </div>

              <div
                className={cn(
                  'mt-4 rounded-lg border px-3 py-2.5 text-sm',
                  hasCapacityInput
                    ? 'border-emerald-200 bg-white text-[#1a1a1a] dark:border-emerald-900 dark:bg-slate-950 dark:text-foreground'
                    : 'border-dashed border-slate-300 bg-white/60 text-muted-foreground dark:border-slate-600',
                )}
                aria-live="polite"
              >
                {hasCapacityInput ? (
                  <>
                    Capacidad máxima total recalculada automáticamente:{' '}
                    <strong className="tabular-nums">{calculatedTotalCapacity}</strong>{' '}
                    pasajeros
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                      {(seatedParsed ?? 0)} sentados + {(standingParsed ?? 0)} parados
                    </span>
                  </>
                ) : (
                  'Capacidad máxima total recalculada automáticamente: ingresa sentados y parados para ver el total.'
                )}
              </div>
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label>Estado inicial</Label>
              <div
                className="flex flex-wrap gap-2"
                role="radiogroup"
                aria-label="Estado inicial del bus"
              >
                {BUS_STATUS_OPTIONS.map((option) => {
                  const selected = status === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      data-selected={selected}
                      disabled={loading}
                      onClick={() => { setStatus(option); }}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50',
                        STATUS_CHIP_CLASSES[option],
                      )}
                    >
                      {BUS_STATUS_LABELS[option]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Foto del bus (opcional)</Label>
            <input
              id={fileInputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="sr-only"
              disabled={loading}
            />
            <Button type="button" variant="outline" className="w-full" asChild>
              <label htmlFor={fileInputId} className="cursor-pointer">
                <Upload className="size-4" />
                {photo ? 'Reemplazar foto' : 'Subir foto'}
              </label>
            </Button>
            <FieldError message={fieldErrors.photo} />
            {photoPreview ? (
              <div className="relative mt-1 w-fit overflow-hidden rounded-lg border bg-slate-50">
                <img
                  src={photoPreview}
                  alt="Vista previa de la foto del bus"
                  className="h-28 w-40 object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(null);
                    clearFieldError('photo');
                  }}
                  disabled={loading}
                  aria-label="Eliminar foto"
                  className="absolute right-1.5 top-1.5 inline-flex size-7 items-center justify-center rounded-full bg-red-600 text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  <X className="size-3.5" />
                </button>
                {photo ? (
                  <p className="truncate px-2 py-1 text-xs text-muted-foreground">
                    {photo.name}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Registrar bus en la flota'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
