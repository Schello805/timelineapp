import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import { LoginForm } from "@/components/login-form";

export default function AdminLoginPage() {
  return (
    <main className="mx-auto grid min-h-[calc(100svh-5rem)] w-full max-w-md content-center px-5 py-12">
      <div className="mb-5 flex justify-center">
        <AppLogo />
      </div>
      <LoginForm />
      <Link className="mt-5 text-center text-sm font-semibold text-stone-700 hover:text-stone-950" href="/">
        Zur Timeline
      </Link>
    </main>
  );
}
