import { LoginSplitCard } from "@/app/components/login/LoginSplitCard";

export default function LoginPage() {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(145deg, color-mix(in oklab, var(--primary) 28%, white 72%) 0%, color-mix(in oklab, var(--background) 80%, var(--primary) 20%) 45%, var(--background) 100%)",
      }}
    >
      <LoginSplitCard />
    </div>
  );
}
