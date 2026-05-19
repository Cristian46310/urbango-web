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
import { useAuthStore } from "@/store/security/authStore";
import { useUserRole } from "@/hooks/security/useUserRole";
import { useRole } from "@/hooks/security/useRole";
import { personRepository, type PersonProfileType } from "@/infra/repository/person";
import { ROLES } from "@/core/domain/entities/security/Roles";

type ProfileTab = PersonProfileType;

export function PersonRegistrationForm() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();
  const { assignMultipleRolesToUser } = useUserRole();
  const { loadRoles } = useRole();

  const [activeTab, setActiveTab] = useState<ProfileTab>("citizen");
  const [loading, setLoading] = useState(false);
  const [existingDriver, setExistingDriver] = useState(false);
  const [existingCitizen, setExistingCitizen] = useState(false);

  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
