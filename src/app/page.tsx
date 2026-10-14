import { PersonaGridHero } from "@/components/ui/prisma-hero";
import { LandingSections } from "@/components/ui/landing-sections";

export default function LandingPage() {
  return (
    <main className="bg-black text-[#E1E0CC] selection:bg-[#E1E0CC] selection:text-black scroll-smooth">
      <PersonaGridHero />
      <LandingSections />
    </main>
  );
}
