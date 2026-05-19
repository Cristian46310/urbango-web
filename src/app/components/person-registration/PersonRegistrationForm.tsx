import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { Bus, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/security/authStore";
import { useUserRole } from "@/hooks/security/useUserRole";
import { useRole } from "@/hooks/security/useRole";
import { personRepository, type PersonProfileType } from "@/infra/repository/person";
import {
  enterpriseRepository,
  type Enterprise,
} from "@/infra/repository/enterprise";
import { ROLES } from "@/core/domain/entities/security/Roles";
import type { DecodedToken } from "@/services/AuthService";

type ProfileTab = PersonProfileType;

function tokenEnterpriseId(decodedToken: DecodedToken | null): string {
  const value = decodedToken?.enterpriseId;
  return typeof value === "string" ? value : "";
}

export function PersonRegistrationForm() {
  const navigate = useNavigate();
  const { currentUser, decodedToken, logout } = useAuthStore();
  const { assignMultipleRolesToUser } = useUserRole();
  const { loadRoles } = useRole();

  const [activeTab, setActiveTab] = useState<ProfileTab>("citizen");
  const [loading, setLoading] = useState(false);
  const [existingDriver, setExistingDriver] = useState(false);
  const [existingCitizen, setExistingCitizen] = useState(false);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [enterprisesLoading, setEnterprisesLoading] = useState(false);

  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [enterpriseId, setEnterpriseId] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [extraInfo, setExtraInfo] = useState("");

  useEffect(() => {
    if (currentUser?.email) {
      setEmail(currentUser.email);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    const loadProfiles = async () => {
      const [driver, citizen] = await Promise.all([
        personRepository.getMyProfile("driver"),
        personRepository.getMyProfile("citizen"),
      ]);
      setExistingDriver(Boolean(driver));
      setExistingCitizen(Boolean(citizen));
    };

    void loadProfiles();
  }, []);

  useEffect(() => {
    const fromToken = tokenEnterpriseId(decodedToken);
    if (fromToken) {
      setEnterpriseId(fromToken);
    }
  }, [decodedToken]);

  useEffect(() => {
    const loadEnterprises = async () => {
      setEnterprisesLoading(true);
      try {
        const items = await enterpriseRepository.list();
        setEnterprises(items);
      } catch {
        toast.error("No se pudieron cargar las empresas de transporte");
      } finally {
        setEnterprisesLoading(false);
      }
    };

    void loadEnterprises();
  }, []);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedDocument = document.trim();

    if (!trimmedName || !trimmedDocument) {
      toast.error("Nombre y documento son obligatorios");
      return;
    }

    if (!currentUser?.id) {
      toast.error("Debes iniciar sesión para registrarte");
      return;
    }

    if (activeTab === "driver" && !enterpriseId.trim()) {
      toast.error("Debes seleccionar la empresa a la que perteneces");
      return;
    }

    setLoading(true);
    try {
      await personRepository.register(activeTab, {
        name: trimmedName,
        document: trimmedDocument,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        licenseNumber:
          activeTab === "driver" ? licenseNumber.trim() || undefined : undefined,
        licenseExpiry:
          activeTab === "driver" ? licenseExpiry || undefined : undefined,
        enterpriseId:
          activeTab === "driver" ? enterpriseId.trim() : undefined,
        extraInfo:
          activeTab === "citizen" ? extraInfo.trim() || undefined : undefined,
      });

      const rolesPage = await loadRoles({ page: 0, size: 100 });
      const roleName = activeTab === "driver" ? ROLES.DRIVER : ROLES.CITIZEN;
      const role = rolesPage.content.find(
        (item) => item.name.toUpperCase() === roleName,
      );

      if (role) {
        await assignMultipleRolesToUser({
          userId: currentUser.id,
          roleIds: [role.id],
        });
      } else {
        toast.warning(
          `Perfil creado, pero no se encontró el rol ${roleName} en el sistema`,
        );
      }

      if (activeTab === "driver") {
        setExistingDriver(true);
      } else {
        setExistingCitizen(true);
      }

      toast.success(
        activeTab === "driver"
          ? "Perfil de conductor registrado"
          : "Perfil de ciudadano registrado",
      );
      toast.info(
        "Cierra sesión e ingresa de nuevo para actualizar tus permisos en el menú",
        {
          action: {
            label: "Cerrar sesión",
            onClick: () => {
              logout();
              void navigate("/login");
            },
          },
        },
      );
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
    activeTab === "driver" ? existingDriver : existingCitizen;
  const fieldsDisabled = alreadyRegistered || loading;

  return (
    <Card className="max-w-2xl border border-(--security-border) shadow-sm">
      <CardHeader>
        <CardTitle>Registro de perfil</CardTitle>
        <CardDescription>
          Vincula tu cuenta de seguridad con un perfil de negocio. El identificador
          de usuario se toma automáticamente de tu sesión.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(value) => { setActiveTab(value as ProfileTab); }}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="citizen" className="gap-2">
              <UserRound className="size-4" />
              Ciudadano
            </TabsTrigger>
            <TabsTrigger value="driver" className="gap-2">
              <Bus className="size-4" />
              Conductor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="citizen" className="mt-4">
            {existingCitizen ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                Ya tienes un perfil de ciudadano registrado.
              </p>
            ) : null}
          </TabsContent>

          <TabsContent value="driver" className="mt-4">
            {existingDriver ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                Ya tienes un perfil de conductor registrado.
              </p>
            ) : null}
          </TabsContent>
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
          enterpriseId={enterpriseId}
          setEnterpriseId={setEnterpriseId}
          enterprises={enterprises}
          enterprisesLoading={enterprisesLoading}
          licenseNumber={licenseNumber}
          setLicenseNumber={setLicenseNumber}
          licenseExpiry={licenseExpiry}
          setLicenseExpiry={setLicenseExpiry}
          extraInfo={extraInfo}
          setExtraInfo={setExtraInfo}
          disabled={fieldsDisabled}
        />

        <Button
          type="button"
          className="mt-6 w-full"
          disabled={fieldsDisabled}
          onClick={() => void handleSubmit()}
        >
          {loading
            ? "Registrando..."
            : activeTab === "driver"
              ? "Registrarme como conductor"
              : "Registrarme como ciudadano"}
        </Button>
      </CardContent>
    </Card>
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
  enterpriseId,
  setEnterpriseId,
  enterprises,
  enterprisesLoading,
  licenseNumber,
  setLicenseNumber,
  licenseExpiry,
  setLicenseExpiry,
  extraInfo,
  setExtraInfo,
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
  enterpriseId: string;
  setEnterpriseId: (v: string) => void;
  enterprises: Enterprise[];
  enterprisesLoading: boolean;
  licenseNumber: string;
  setLicenseNumber: (v: string) => void;
  licenseExpiry: string;
  setLicenseExpiry: (v: string) => void;
  extraInfo: string;
  setExtraInfo: (v: string) => void;
  disabled: boolean;
}) {
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

      {activeTab === "driver" ? (
        <>
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
                        : "Selecciona tu empresa"
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
              El conductor queda vinculado a esta empresa en el sistema.
            </p>
          </div>
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
      ) : (
        <div className="grid gap-2">
          <Label htmlFor="profile-extra">Información adicional</Label>
          <Textarea
            id="profile-extra"
            value={extraInfo}
            onChange={(e) => { setExtraInfo(e.target.value); }}
            disabled={disabled}
            rows={3}
          />
        </div>
      )}
    </div>
  );
}
