import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Login | Meeting AI",
  description: "Sign in to your Meeting AI account",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}
