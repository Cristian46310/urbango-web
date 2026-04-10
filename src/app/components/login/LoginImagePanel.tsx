import busImage from "@/assets/background/login.png";

export function LoginImagePanel() {
  return (
    <div className="relative hidden min-h-130 overflow-hidden lg:block">
      <img src={busImage} className="h-full w-full object-cover object-right" />
      <div className="absolute inset-0 bg-linear-to-br from-black/20 via-black/25 to-orange-500/25" />
    </div>
  );
}
