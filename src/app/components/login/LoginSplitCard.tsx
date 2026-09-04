import { LoginForm } from "./LoginForm";
import { LoginImagePanel } from "./LoginImagePanel";

export function LoginSplitCard() {
  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-stretch px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <div
        className="grid w-full overflow-hidden rounded-[2rem] border border-(--security-border) bg-white lg:grid-cols-2"
        style={{
          boxShadow: "0 24px 80px color-mix(in oklab, var(--primary) 18%, transparent)",
        }}
      >
        <LoginForm />
        <LoginImagePanel />
      </div>
    </div>
  );
}
