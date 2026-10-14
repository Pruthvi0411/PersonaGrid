import type { Metadata } from "next";
import { AuthUI } from "@/components/ui/auth-fuse";

export const metadata: Metadata = {
  title: "Sign In / Join | PersonaGrid",
  description: "Access Persona Creator studio or Enterprise Business Center on PersonaGrid.",
};

export default function LoginPage() {
  return <AuthUI />;
}
