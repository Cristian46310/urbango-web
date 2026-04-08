import { LoginForm } from "./LoginForm";
import { LoginImagePanel } from "./LoginImagePanel";

export function LoginSplitCard() {
  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-stretch px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <div className="grid w-full overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_80px_rgba(88,48,124,0.18)] lg:grid-cols-2">
        <LoginForm />
        <LoginImagePanel />
      </div>
    </div>
  );
}
