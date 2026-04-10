import { LoginSplitCard } from "@/app/components/login/LoginSplitCard";

export default function LoginPage() {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(135deg, color-mix(in oklab, var(--accent) 58%, black 4%) 0%, color-mix(in oklab, var(--accent) 42%, white 8%) 38%, color-mix(in oklab, var(--accent) 24%, white 20%) 72%, #f6ece2 100%)",
      }}
    >
      <LoginSplitCard />
    </div>
  );
}
