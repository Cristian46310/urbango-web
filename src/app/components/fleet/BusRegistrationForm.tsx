import { useEffect, useId, useMemo, useState } from 'react';
import { Upload, X, Bus as BusIcon, QrCode } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BUS_STATUS_LABELS,
  type Bus,
  type BusStatus,
  type CreateBusDTO,
} from '@/core/domain/entities/business/Bus';
import { useBus } from '@/hooks/business/useBus';

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const CURRENT_YEAR = new Date().getFullYear();

const STATUS_OPTIONS: BusStatus[] = [
  'operativo',
  'mantenimiento',
  'fuera_de_servicio',
];

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
    <Card className="max-w-2xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
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

export function BusRegistrationForm() {
  const fileInputId = useId();
  const { loading, lastRegisteredBus, registerBus, clearLastRegisteredBus } =
    useBus();

  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [capacity, setCapacity] = useState('');
  const [seatedCapacity, setSeatedCapacity] = useState('');
  const [standingCapacity, setStandingCapacity] = useState('');
  const [status, setStatus] = useState<BusStatus>('operativo');
  const [photo, setPhoto] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

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

  const resetForm = () => {
    setPlate('');
    setModel('');
    setYear(String(CURRENT_YEAR));
    setCapacity('');
    setSeatedCapacity('');
    setStandingCapacity('');
    setStatus('operativo');
    setPhoto(null);
    setFormError(null);
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setFormError('Solo se permiten imágenes JPEG, PNG o WebP');
      return;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      setFormError('La foto no puede superar 10 MB');
      return;
    }

    setFormError(null);
    setPhoto(file);
  };

  const validateForm = (): CreateBusDTO | null => {
    const trimmedPlate = plate.trim().toUpperCase();
    const trimmedModel = model.trim();
    const yearValue = Number.parseInt(year, 10);
    const capacityValue = Number.parseInt(capacity, 10);
    const seated = parseOptionalInt(seatedCapacity);
    const standing = parseOptionalInt(standingCapacity);

    if (!trimmedPlate) {
      setFormError('La placa es obligatoria');
      return null;
    }

    if (!trimmedModel) {
      setFormError('El modelo es obligatorio');
      return null;
    }

    if (Number.isNaN(yearValue) || yearValue < 1900 || yearValue > CURRENT_YEAR + 1) {
      setFormError(`El año debe estar entre 1900 y ${CURRENT_YEAR + 1}`);
      return null;
    }

    if (Number.isNaN(capacityValue) || capacityValue < 1) {
      setFormError('La capacidad máxima debe ser al menos 1 pasajero');
      return null;
    }

    if (
      seated != null &&
      standing != null &&
      seated + standing > capacityValue
    ) {
      setFormError(
        'La suma de capacidad sentados y parados no puede superar la capacidad máxima',
      );
      return null;
    }

    if (seated != null && seated < 0) {
      setFormError('La capacidad sentados no puede ser negativa');
      return null;
    }

    if (standing != null && standing < 0) {
      setFormError('La capacidad parados no puede ser negativa');
      return null;
    }

    setFormError(null);

    return {
      plate: trimmedPlate,
      model: trimmedModel,
      year: yearValue,
      capacity: capacityValue,
      status,
      ...(seated != null ? { seatedCapacity: seated } : {}),
      ...(standing != null ? { standingCapacity: standing } : {}),
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
      // El store ya muestra el toast de error
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
    <Card className="max-w-2xl border border-(--security-border) shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BusIcon className="size-5" />
          Datos del bus
        </CardTitle>
        <CardDescription>
          El bus se asocia automáticamente a tu empresa con la sesión actual.
          Al guardar se genera un código QR único para validaciones rápidas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="grid gap-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="bus-plate">Placa (única)</Label>
              <Input
                id="bus-plate"
                value={plate}
                onChange={(event) => setPlate(event.target.value)}
                placeholder="ABC-123"
                disabled={loading}
                autoComplete="off"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bus-model">Modelo</Label>
              <Input
                id="bus-model"
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder="Mercedes-Benz O500"
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bus-year">Año</Label>
              <Input
                id="bus-year"
                type="number"
                min={1900}
                max={CURRENT_YEAR + 1}
                value={year}
                onChange={(event) => setYear(event.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="bus-capacity">Capacidad máxima de pasajeros</Label>
              <Input
                id="bus-capacity"
                type="number"
                min={1}
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
                placeholder="40"
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bus-seated">Capacidad sentados (opcional)</Label>
              <Input
                id="bus-seated"
                type="number"
                min={0}
                value={seatedCapacity}
                onChange={(event) => setSeatedCapacity(event.target.value)}
                placeholder="35"
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bus-standing">Capacidad parados (opcional)</Label>
              <Input
                id="bus-standing"
                type="number"
                min={0}
                value={standingCapacity}
                onChange={(event) => setStandingCapacity(event.target.value)}
                placeholder="5"
                disabled={loading}
              />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label>Estado inicial</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as BusStatus)}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{BUS_STATUS_LABELS[status]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {BUS_STATUS_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                {photo ? 'Cambiar foto' : 'Subir foto'}
              </label>
            </Button>
            {photoPreview ? (
              <div className="relative h-32 w-full overflow-hidden rounded-lg border">
                <img
                  src={photoPreview}
                  alt="Vista previa"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  disabled={loading}
                  aria-label="Quitar foto"
                  className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-full bg-red-600 text-white shadow-sm"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : null}
          </div>

          {formError ? (
            <p className="text-sm text-red-600" role="alert">
              {formError}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Guardando...' : 'Registrar bus en la flota'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
