import { useEffect, useId, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { Bus, CreditCard, MessageCircle, ShieldUser, Trash2, Upload, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/security/authStore";
import { useLoginStore } from "@/store/security/loginStore";
import { useLogin } from "@/hooks/security";
import {
  PERSON_PHOTO_ACCEPT,
  PERSON_PHOTO_MAX_BYTES,
  personRepository,
  type PersonPhotoType,
  type PersonProfileResponse,
  type PersonProfileType,
} from "@/infra/repository/person";
import {
  enterpriseRepository,
  type Enterprise,
} from "@/infra/repository/enterprise";
import { ROLES } from "@/core/domain/entities/security/Roles";
import type { DecodedToken } from "@/services/AuthService";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

type ProfileTab = PersonProfileType;

function tokenEnterpriseId(decodedToken: DecodedToken | null): string {
  const value = decodedToken?.enterpriseId;
  return typeof value === "string" ? value : "";
}

function initialsFromName(name?: string, email?: string): string {
  const source = (name ?? email ?? "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase() || "?";
}

const profileLabels: Record<ProfileTab, { registered: string; submit: string; success: string }> = {
  citizen: {
    registered: "Ya tienes un perfil de ciudadano registrado.",
    submit: "Registrarme como ciudadano",
    success: "Perfil de ciudadano registrado",
  },
  driver: {
    registered: "Ya tienes un perfil de conductor registrado.",
    submit: "Registrarme como conductor",
    success: "Perfil de conductor registrado",
  },
  supervisor: {
    registered: "Ya tienes un perfil de supervisor registrado.",
    submit: "Registrarme como supervisor",
    success: "Perfil de supervisor registrado",
  },
};

function expectedJwtRole(tab: ProfileTab): string {
  if (tab === "driver") return ROLES.DRIVER;
  if (tab === "supervisor") return ROLES.SUPERVISOR;
  return ROLES.CITIZEN;
}

function applyProfileToForm(
  profile: PersonProfileResponse,
  setters: {
    setName: (v: string) => void;
    setDocument: (v: string) => void;
    setEmail: (v: string) => void;
    setPhone: (v: string) => void;
    setBirthDate: (v: string) => void;
    setAddress: (v: string) => void;
    setCity: (v: string) => void;
    setLicenseNumber: (v: string) => void;
    setLicenseExpiry: (v: string) => void;
    setEnterpriseId: (v: string) => void;
  },
) {
  if (profile.name) setters.setName(profile.name);
  if (profile.document) setters.setDocument(profile.document);
  if (profile.email) setters.setEmail(profile.email);
  if (profile.phone) setters.setPhone(profile.phone);
  if (profile.birthDate) setters.setBirthDate(profile.birthDate.slice(0, 10));
  if (profile.address?.address) setters.setAddress(profile.address.address);
  if (profile.address?.city) setters.setCity(profile.address.city);
  if (profile.licenseNumber) setters.setLicenseNumber(profile.licenseNumber);
  if (profile.licenseExpiry) setters.setLicenseExpiry(profile.licenseExpiry.slice(0, 10));
  if (profile.enterpriseId) setters.setEnterpriseId(profile.enterpriseId);
}

export function PersonRegistrationForm() {
  const navigate = useNavigate();
  const { currentUser, decodedToken, hasRole, hasAnyRole } = useAuthStore();
  const { refreshToken } = useLogin();

  const [activeTab, setActiveTab] = useState<ProfileTab>("citizen");
  const [loading, setLoading] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [activatingPermissions, setActivatingPermissions] = useState(false);
  const [citizenProfile, setCitizenProfile] = useState<PersonProfileResponse | null>(null);
  const [driverProfile, setDriverProfile] = useState<PersonProfileResponse | null>(null);
  const [supervisorProfile, setSupervisorProfile] = useState<PersonProfileResponse | null>(null);
  const [securityName, setSecurityName] = useState("");
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [enterprisesLoading, setEnterprisesLoading] = useState(false);

  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [enterpriseId, setEnterpriseId] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");

  const hasDriverRole = hasRole(ROLES.DRIVER);
  const hasSupervisorRole = hasAnyRole([ROLES.SUPERVISOR, ROLES.SUPERVISER]);
  const existingCitizen = Boolean(citizenProfile);
  const existingDriver = Boolean(driverProfile);
  const existingSupervisor = Boolean(supervisorProfile);

  const visibleTabs = useMemo(() => {
    const tabs: ProfileTab[] = ["citizen"];
    if (hasDriverRole) tabs.push("driver");
    if (hasSupervisorRole) tabs.push("supervisor");
    return tabs;
  }, [hasDriverRole, hasSupervisorRole]);

  const tabsGridClass =
    visibleTabs.length === 1
      ? "grid-cols-1"
      : visibleTabs.length === 2
        ? "grid-cols-2"
        : "grid-cols-3";

  useEffect(() => {
    if (currentUser?.email) {
      setEmail(currentUser.email);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab("citizen");
    }
  }, [activeTab, visibleTabs]);

  useEffect(() => {
    let cancelled = false;

    const loadIdentityAndProfiles = async () => {
      setLoadingProfiles(true);
      try {
        const me = await useLoginStore.getState().getMe().catch(() => null);
        if (cancelled) return;

        if (me?.name) {
          setSecurityName(me.name);
          setName((prev) => prev || me.name);
        }
        if (me?.email) {
          setEmail((prev) => prev || me.email);
        }

        const [citizen, driver, supervisor] = await Promise.all([
          personRepository.getMyProfile("citizen"),
          hasDriverRole
            ? personRepository.getMyProfile("driver")
            : Promise.resolve(null),
          hasSupervisorRole
            ? personRepository.getMyProfile("supervisor")
            : Promise.resolve(null),
        ]);

        if (cancelled) return;

        setCitizenProfile(citizen);
        setDriverProfile(driver);
        setSupervisorProfile(supervisor);

        const formSetters = {
          setName,
          setDocument,
          setEmail,
          setPhone,
          setBirthDate,
          setAddress,
          setCity,
          setLicenseNumber,
          setLicenseExpiry,
          setEnterpriseId,
        };
        if (citizen) applyProfileToForm(citizen, formSetters);
        else if (driver) applyProfileToForm(driver, formSetters);
        else if (supervisor) applyProfileToForm(supervisor, formSetters);
      } finally {
        if (!cancelled) {
          setLoadingProfiles(false);
        }
      }
    };

    void loadIdentityAndProfiles();
    return () => {
      cancelled = true;
    };
  }, [hasDriverRole, hasSupervisorRole]);

  useEffect(() => {
    const fromToken = tokenEnterpriseId(decodedToken);
    if (fromToken) {
      setEnterpriseId(fromToken);
    }
  }, [decodedToken]);

  useEffect(() => {
    if (!hasDriverRole && !hasSupervisorRole) {
      return;
    }

    let cancelled = false;
    const loadEnterprises = async () => {
      setEnterprisesLoading(true);
      try {
        const items = await enterpriseRepository.list();
        if (!cancelled) {
          setEnterprises(items);
        }
      } catch {
        if (!cancelled) {
          toast.error("No se pudieron cargar las empresas de transporte");
        }
      } finally {
        if (!cancelled) {
          setEnterprisesLoading(false);
        }
      }
    };

    void loadEnterprises();
    return () => {
      cancelled = true;
    };
  }, [hasDriverRole, hasSupervisorRole]);

  const handlePhotoUploaded = (type: PersonPhotoType, updated: PersonProfileResponse) => {
    if (type === "citizen") {
      setCitizenProfile(updated);
    } else {
      setDriverProfile(updated);
    }
  };

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedDocument = document.trim();
    const trimmedAddress = address.trim();
    const trimmedCity = city.trim();

    if (!trimmedName || !trimmedDocument) {
      toast.error("Nombre y documento son obligatorios");
      return;
    }

    if (activeTab === "citizen" && (!trimmedAddress || !trimmedCity)) {
      toast.error("Dirección y ciudad son obligatorias");
      return;
    }

    if (!currentUser?.id) {
      toast.error("Debes iniciar sesión para registrarte");
      return;
    }

    if (activeTab === "driver" && !hasDriverRole) {
      toast.error("Tu cuenta aún no fue promovida a conductor");
      return;
    }

    if (activeTab === "supervisor" && !hasSupervisorRole) {
      toast.error("Tu cuenta aún no tiene rol de supervisor");
      return;
    }

    const needsEnterprise = activeTab === "driver" || activeTab === "supervisor";
    if (needsEnterprise && !enterpriseId.trim()) {
      toast.error("Debes seleccionar la empresa de transporte");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: trimmedName,
        document: trimmedDocument,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        birthDate:
          activeTab === "citizen" && birthDate ? birthDate : undefined,
        address:
          activeTab === "citizen"
            ? { address: trimmedAddress, city: trimmedCity }
            : undefined,
        licenseNumber:
          activeTab === "driver" ? licenseNumber.trim() || undefined : undefined,
        licenseExpiry: activeTab === "driver" ? licenseExpiry || undefined : undefined,
        enterpriseId: needsEnterprise ? enterpriseId.trim() : undefined,
      };

      const created = await personRepository.register(activeTab, payload);

      if (activeTab === "driver") {
        setDriverProfile(created);
      } else if (activeTab === "supervisor") {
        setSupervisorProfile(created);
      } else {
        setCitizenProfile(created);
        if (created.address?.address) setAddress(created.address.address);
        if (created.address?.city) setCity(created.address.city);
      }

      toast.success(profileLabels[activeTab].success);

      if (activeTab === "citizen" || activeTab === "supervisor") {
        setActivatingPermissions(true);
        toast.info("Activando permisos…");
        try {
          await refreshToken({
            expectedRole: expectedJwtRole(activeTab),
            maxAttempts: 6,
            intervalMs: 5000,
          });
          toast.success("Permisos actualizados. El menú ya refleja tu nuevo perfil.");
        } catch {
          toast.warning(
            "Perfil creado, pero los permisos aún se están activando. Espera unos segundos o vuelve a iniciar sesión.",
          );
        } finally {
          setActivatingPermissions(false);
        }
      }

      if (activeTab === "supervisor") {
        void navigate("/app");
      }
    } catch (error) {
      let message = "No se pudo completar el registro";
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as { message?: string | string[] } | undefined;
        if (typeof data?.message === "string") {
          message = data.message;
        } else if (Array.isArray(data?.message)) {
          message = data.message.join(", ");
        }
      } else if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const alreadyRegistered =
    activeTab === "driver"
      ? existingDriver
      : activeTab === "supervisor"
        ? existingSupervisor
        : existingCitizen;
  const fieldsDisabled = alreadyRegistered || loading || activatingPermissions || loadingProfiles;
  const labels = profileLabels[activeTab];
  const submitDisabled =
    fieldsDisabled
    || (activeTab === "driver" && !hasDriverRole)
    || (activeTab === "supervisor" && !hasSupervisorRole);

  const activePhotoProfile =
    activeTab === "citizen"
      ? citizenProfile
      : activeTab === "driver"
        ? driverProfile
        : null;
  const canUploadPhoto =
    (activeTab === "citizen" || activeTab === "driver") && Boolean(activePhotoProfile);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Card className="border border-(--security-border) shadow-sm">
        <CardHeader>
          <CardTitle>Mi perfil</CardTitle>
          <CardDescription>
            Identidad en seguridad
            {securityName || currentUser?.email
              ? `: ${securityName || currentUser?.email}`
              : ""}
            . El perfil de persona vive en negocio (ciudadano / conductor).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {loadingProfiles ? (
            <p className="text-muted-foreground">Cargando estados de perfil…</p>
          ) : (
            <>
              <div className="flex flex-wrap items-start gap-4">
                {existingCitizen ? (
                  <ProfileAvatar
                    photoUrl={citizenProfile?.photoUrl}
                    name={citizenProfile?.name ?? securityName}
                    email={citizenProfile?.email ?? currentUser?.email}
                    label="Ciudadano"
                  />
                ) : null}
                {existingDriver ? (
                  <ProfileAvatar
                    photoUrl={driverProfile?.photoUrl}
                    name={driverProfile?.name ?? securityName}
                    email={driverProfile?.email ?? currentUser?.email}
                    label="Conductor"
                  />
                ) : null}
              </div>
              <ProfileStatusRow
                ok={existingCitizen}
                label="Ciudadano"
                missingCta="Completar perfil ciudadano"
                onMissingCta={() => { setActiveTab("citizen"); }}
              />
              {hasDriverRole ? (
                <ProfileStatusRow
                  ok={existingDriver}
                  label="Conductor"
                  missingCta="Completar perfil conductor"
                  onMissingCta={() => { setActiveTab("driver"); }}
                />
              ) : null}
              {hasSupervisorRole ? (
                <ProfileStatusRow
                  ok={existingSupervisor}
                  label="Supervisor"
                  missingCta="Completar perfil supervisor"
                  onMissingCta={() => { setActiveTab("supervisor"); }}
                />
              ) : null}
              {existingCitizen ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/app/payment-methods">
                      <CreditCard className="mr-1.5 size-4" />
                      Métodos de pago
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/app/card-recharge">
                      <CreditCard className="mr-1.5 size-4" />
                      Recargar
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/app/messaging">
                      <MessageCircle className="mr-1.5 size-4" />
                      Grupos
                    </Link>
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Sin perfil ciudadano no podrás usar pagos ciudadano ni grupos de mensajería.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border border-(--security-border) shadow-sm">
        <CardHeader>
          <CardTitle>Registro de perfil</CardTitle>
          <CardDescription>
            Completa el perfil según tu rol. La foto se puede subir después de crear el perfil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => { setActiveTab(value as ProfileTab); }}
          >
            <TabsList className={cn("grid w-full", tabsGridClass)}>
              <TabsTrigger value="citizen" className="gap-2">
                <UserRound className="size-4" />
                Ciudadano
              </TabsTrigger>
              {hasDriverRole ? (
                <TabsTrigger value="driver" className="gap-2">
                  <Bus className="size-4" />
                  Conductor
                </TabsTrigger>
              ) : null}
              {hasSupervisorRole ? (
                <TabsTrigger value="supervisor" className="gap-2">
                  <ShieldUser className="size-4" />
                  Supervisor
                </TabsTrigger>
              ) : null}
            </TabsList>

            {activatingPermissions ? (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Activando permisos… esto puede tardar hasta ~30 segundos.
              </div>
            ) : null}

            <TabsContent value="citizen" className="mt-4">
              {existingCitizen ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  {profileLabels.citizen.registered}
                  {citizenProfile?.name ? ` (${citizenProfile.name})` : ""}
                </p>
              ) : null}
            </TabsContent>

            {hasDriverRole ? (
              <TabsContent value="driver" className="mt-4">
                {existingDriver ? (
                  <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    {profileLabels.driver.registered}
                    {driverProfile?.name ? ` (${driverProfile.name})` : ""}
                  </p>
                ) : null}
              </TabsContent>
            ) : null}

            {hasSupervisorRole ? (
              <TabsContent value="supervisor" className="mt-4">
                {existingSupervisor ? (
                  <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    {profileLabels.supervisor.registered}
                    {supervisorProfile?.name ? ` (${supervisorProfile.name})` : ""}
                  </p>
                ) : null}
              </TabsContent>
            ) : null}
          </Tabs>

          <ProfileFormFields
            activeTab={activeTab}
            name={name}
            setName={setName}
            document={document}
            setDocument={setDocument}
            email={email}
            setEmail={setEmail}
            phone={phone}
            setPhone={setPhone}
            birthDate={birthDate}
            setBirthDate={setBirthDate}
            address={address}
            setAddress={setAddress}
            city={city}
            setCity={setCity}
            enterpriseId={enterpriseId}
            setEnterpriseId={setEnterpriseId}
            enterprises={enterprises}
            enterprisesLoading={enterprisesLoading}
            licenseNumber={licenseNumber}
            setLicenseNumber={setLicenseNumber}
            licenseExpiry={licenseExpiry}
            setLicenseExpiry={setLicenseExpiry}
            disabled={fieldsDisabled}
          />

          {!alreadyRegistered ? (
            <Button
              type="button"
              className="mt-6 w-full"
              disabled={submitDisabled}
              onClick={() => void handleSubmit()}
            >
              {activatingPermissions
                ? "Activando permisos…"
                : loading
                  ? "Registrando..."
                  : labels.submit}
            </Button>
          ) : null}

          {canUploadPhoto && activePhotoProfile && (activeTab === "citizen" || activeTab === "driver") ? (
            <ProfilePhotoUpload
              type={activeTab}
              profile={activePhotoProfile}
              onUploaded={handlePhotoUploaded}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileAvatar({
  photoUrl,
  name,
  email,
  label,
}: {
  photoUrl?: string | null;
  name?: string;
  email?: string;
  label: string;
}) {
  const initials = initialsFromName(name, email);
  return (
    <div className="flex items-center gap-3">
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={`Foto de ${label}`}
          className="size-14 rounded-full border object-cover"
        />
      ) : (
        <div
          className="flex size-14 items-center justify-center rounded-full border bg-slate-100 text-sm font-semibold text-slate-700"
          aria-hidden
        >
          {initials}
        </div>
      )}
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">{name ?? email ?? "—"}</p>
      </div>
    </div>
  );
}

function ProfilePhotoUpload({
  type,
  profile,
  onUploaded,
}: {
  type: PersonPhotoType;
  profile: PersonProfileResponse;
  onUploaded: (type: PersonPhotoType, updated: PersonProfileResponse) => void;
}) {
  const fileInputId = useId();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const previewUrl = useMemo(
    () => (pendingFile ? URL.createObjectURL(pendingFile) : null),
    [pendingFile],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const displayUrl = previewUrl ?? profile.photoUrl ?? null;
  const busy = uploading || deleting;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Selecciona una imagen JPEG, PNG o WebP");
      return;
    }
    if (file.size > PERSON_PHOTO_MAX_BYTES) {
      toast.error("La foto no puede superar 5 MB");
      return;
    }
    setPendingFile(file);
  };

  const handleUpload = async () => {
    if (!pendingFile) {
      toast.error("Selecciona una foto primero");
      return;
    }
    setUploading(true);
    try {
      const updated = await personRepository.uploadMyPhoto(type, pendingFile);
      onUploaded(type, updated);
      setPendingFile(null);
      toast.success("Foto actualizada");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "No se pudo subir la foto"));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const updated = await personRepository.deleteMyPhoto(type);
      onUploaded(type, { ...updated, photoUrl: updated.photoUrl ?? null });
      setPendingFile(null);
      toast.success("Foto eliminada");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "No se pudo eliminar la foto"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mt-6 space-y-3 rounded-lg border border-dashed p-4">
      <div>
        <Label className="text-base">Foto de perfil</Label>
        <p className="text-muted-foreground text-xs">
          JPEG, PNG o WebP · máx. 5 MB. Se sube después de crear el perfil.
        </p>
      </div>

      <div className="flex items-center gap-4">
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Vista previa de foto"
            className="size-20 rounded-full border object-cover"
          />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-full border bg-slate-100 text-sm font-semibold text-slate-700">
            {initialsFromName(profile.name, profile.email)}
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2">
          <input
            id={fileInputId}
            type="file"
            accept={PERSON_PHOTO_ACCEPT}
            className="sr-only"
            disabled={busy}
            onChange={handleFileChange}
          />
          <Button type="button" variant="outline" className="w-full" asChild>
            <label htmlFor={fileInputId} className="cursor-pointer">
              <Upload className="size-4" />
              {pendingFile || profile.photoUrl ? "Cambiar foto" : "Elegir foto"}
            </label>
          </Button>
          {pendingFile ? (
            <div className="flex gap-2">
              <Button
                type="button"
                className="flex-1"
                disabled={busy}
                onClick={() => void handleUpload()}
              >
                {uploading ? "Subiendo…" : "Subir foto"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={busy}
                aria-label="Quitar selección"
                onClick={() => { setPendingFile(null); }}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : null}
          {profile.photoUrl && !pendingFile ? (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-destructive hover:text-destructive"
              disabled={busy}
              onClick={() => void handleDelete()}
            >
              <Trash2 className="size-4" />
              {deleting ? "Eliminando…" : "Eliminar foto"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ProfileStatusRow({
  ok,
  label,
  missingCta,
  onMissingCta,
}: {
  ok: boolean;
  label: string;
  missingCta: string;
  onMissingCta: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
      <span>
        {label}:{" "}
        <span className={ok ? "font-medium text-emerald-700" : "font-medium text-amber-800"}>
          {ok ? "completo" : "pendiente"}
        </span>
      </span>
      {!ok ? (
        <Button type="button" size="sm" variant="secondary" onClick={onMissingCta}>
          {missingCta}
        </Button>
      ) : null}
    </div>
  );
}

function ProfileFormFields({
  activeTab,
  name,
  setName,
  document,
  setDocument,
  email,
  setEmail,
  phone,
  setPhone,
  birthDate,
  setBirthDate,
  address,
  setAddress,
  city,
  setCity,
  enterpriseId,
  setEnterpriseId,
  enterprises,
  enterprisesLoading,
  licenseNumber,
  setLicenseNumber,
  licenseExpiry,
  setLicenseExpiry,
  disabled,
}: {
  activeTab: ProfileTab;
  name: string;
  setName: (v: string) => void;
  document: string;
  setDocument: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  birthDate: string;
  setBirthDate: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  enterpriseId: string;
  setEnterpriseId: (v: string) => void;
  enterprises: Enterprise[];
  enterprisesLoading: boolean;
  licenseNumber: string;
  setLicenseNumber: (v: string) => void;
  licenseExpiry: string;
  setLicenseExpiry: (v: string) => void;
  disabled: boolean;
}) {
  const showEnterprise = activeTab === "driver" || activeTab === "supervisor";

  return (
    <div className="mt-6 grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="profile-name">Nombre completo</Label>
        <Input
          id="profile-name"
          value={name}
          onChange={(e) => { setName(e.target.value); }}
          disabled={disabled}
          placeholder="María Gómez"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="profile-document">Documento</Label>
        <Input
          id="profile-document"
          value={document}
          onChange={(e) => { setDocument(e.target.value); }}
          disabled={disabled}
          placeholder="12345678"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="profile-email">Correo</Label>
        <Input
          id="profile-email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); }}
          disabled={disabled}
          placeholder="maria@example.com"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="profile-phone">Teléfono</Label>
        <Input
          id="profile-phone"
          value={phone}
          onChange={(e) => { setPhone(e.target.value); }}
          disabled={disabled}
          placeholder="+573001234567"
        />
      </div>

      {activeTab === "citizen" ? (
        <>
          <div className="grid gap-2">
            <Label htmlFor="profile-birth-date">Fecha de nacimiento</Label>
            <Input
              id="profile-birth-date"
              type="date"
              value={birthDate}
              onChange={(e) => { setBirthDate(e.target.value); }}
              disabled={disabled}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-address">Dirección</Label>
            <Input
              id="profile-address"
              value={address}
              onChange={(e) => { setAddress(e.target.value); }}
              disabled={disabled}
              placeholder="Calle 10 #20-30"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-city">Ciudad</Label>
            <Input
              id="profile-city"
              value={city}
              onChange={(e) => { setCity(e.target.value); }}
              disabled={disabled}
              placeholder="Manizales"
            />
          </div>
        </>
      ) : null}

      {showEnterprise ? (
        <div className="grid gap-2">
          <Label htmlFor="profile-enterprise">
            Empresa de transporte <span className="text-destructive">*</span>
          </Label>
          <Select
            value={enterpriseId || undefined}
            onValueChange={setEnterpriseId}
            disabled={disabled || enterprisesLoading}
          >
            <SelectTrigger id="profile-enterprise" className="w-full">
              <SelectValue
                placeholder={
                  enterprisesLoading
                    ? "Cargando empresas..."
                    : enterprises.length === 0
                      ? "No hay empresas registradas"
                      : "Selecciona la empresa"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {enterprises.map((enterprise) => (
                <SelectItem key={enterprise.id} value={enterprise.id}>
                  {enterprise.name} — NIT {enterprise.nit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">
            {activeTab === "supervisor"
              ? "El supervisor queda vinculado a esta empresa para gestionar su operación."
              : "El conductor queda vinculado a esta empresa en el sistema."}
          </p>
        </div>
      ) : null}

      {activeTab === "driver" ? (
        <>
          <div className="grid gap-2">
            <Label htmlFor="profile-license">Número de licencia</Label>
            <Input
              id="profile-license"
              value={licenseNumber}
              onChange={(e) => { setLicenseNumber(e.target.value); }}
              disabled={disabled}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-license-expiry">Vencimiento de licencia</Label>
            <Input
              id="profile-license-expiry"
              type="date"
              value={licenseExpiry}
              onChange={(e) => { setLicenseExpiry(e.target.value); }}
              disabled={disabled}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
