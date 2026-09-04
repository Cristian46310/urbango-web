import busImage from "@/assets/background/login.png";

export function LoginImagePanel() {
  return (
    <div className="relative hidden min-h-130 overflow-hidden lg:block">
      <img src={busImage} alt="" className="h-full w-full object-cover object-right" />
      <div className="absolute inset-0 bg-linear-to-br from-teal-950/35 via-slate-900/30 to-teal-800/25" />
    </div>
  );
}
