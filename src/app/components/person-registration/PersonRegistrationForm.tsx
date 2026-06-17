import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { Bus, ShieldUser, UserRound } from "lucide-react";
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

function roleForTab(tab: ProfileTab): string {
  if (tab === "driver") return ROLES.DRIVER;
  if (tab === "supervisor") return ROLES.SUPERVISER;
  return ROLES.CITIZEN;
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
  const [existingSupervisor, setExistingSupervisor] = useState(false);
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [enterprisesLoading, setEnterprisesLoading] = useState(false);

  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [enterpriseId, setEnterpriseId] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiry, setLicenseExpiry] = useState("");

  useEffect(() => {
    if (currentUser?.email) {
      setEmail(currentUser.email);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    const loadProfiles = async () => {
      const [driver, citizen, supervisor] = await Promise.all([
        personRepository.getMyProfile("driver"),
        personRepository.getMyProfile("citizen"),
        personRepository.getMyProfile("supervisor"),
      ]);
      setExistingDriver(Boolean(driver));
      setExistingCitizen(Boolean(citizen));
      setExistingSupervisor(Boolean(supervisor));
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
        licenseNumber:
          activeTab === "driver" ? licenseNumber.trim() || undefined : undefined,
        licenseExpiry: activeTab === "driver" ? licenseExpiry || undefined : undefined,
        enterpriseId: needsEnterprise ? enterpriseId.trim() : undefined,
      };

      await personRepository.register(activeTab, payload);

      const rolesPage = await loadRoles({ page: 0, size: 100 });
      const roleName = roleForTab(activeTab);
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
      } else if (activeTab === "supervisor") {
        setExistingSupervisor(true);
      } else {
        setExistingCitizen(true);
      }

      toast.success(profileLabels[activeTab].success);
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
    activeTab === "driver"
      ? existingDriver
      : activeTab === "supervisor"
        ? existingSupervisor
        : existingCitizen;
  const fieldsDisabled = alreadyRegistered || loading;
  const labels = profileLabels[activeTab];

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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="citizen" className="gap-2">
              <UserRound className="size-4" />
              Ciudadano
            </TabsTrigger>
            <TabsTrigger value="driver" className="gap-2">
              <Bus className="size-4" />
              Conductor
            </TabsTrigger>
            <TabsTrigger value="supervisor" className="gap-2">
              <ShieldUser className="size-4" />
              Supervisor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="citizen" className="mt-4">
            {existingCitizen ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                {profileLabels.citizen.registered}
              </p>
            ) : null}
          </TabsContent>

          <TabsContent value="driver" className="mt-4">
            {existingDriver ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                {profileLabels.driver.registered}
              </p>
            ) : null}
          </TabsContent>

          <TabsContent value="supervisor" className="mt-4">
            {existingSupervisor ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                {profileLabels.supervisor.registered}
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
          disabled={fieldsDisabled}
        />

        <Button
          type="button"
          className="mt-6 w-full"
          disabled={fieldsDisabled}
          onClick={() => void handleSubmit()}
        >
          {loading ? "Registrando..." : labels.submit}
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
