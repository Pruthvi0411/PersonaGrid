// prisma-hero.tsx
"use client";

import { motion, useInView } from "framer-motion";
import { ArrowRight, Menu } from "lucide-react";
import { useRef } from "react";
import Link from "next/link";

/* ---------------- WordsPullUp ---------------- */
interface WordsPullUpProps {
  text: string;
  className?: string;
  showAsterisk?: boolean;
  style?: React.CSSProperties;
}

export const WordsPullUp = ({ text, className = "", showAsterisk = false, style }: WordsPullUpProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const words = text.split(" ");

  return (
    <div ref={ref} className={`inline-flex flex-wrap items-baseline ${className}`} style={style}>
      {words.map((word, i) => {
        const isLast = i === words.length - 1;
        return (
          <motion.span
            key={i}
            initial={{ y: 24, opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : { y: 0, opacity: 1 }}
            transition={{ duration: 0.65, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block relative select-none"
            style={{ marginRight: isLast ? 0 : "0.25em" }}
          >
            {word}
            {showAsterisk && isLast && (
              <span className="absolute top-[0.45em] -right-[0.32em] text-[0.32em] leading-none select-none text-[#E1E0CC] drop-shadow-[0_0_12px_rgba(225,224,204,0.5)]">*</span>
            )}
          </motion.span>
        );
      })}
    </div>
  );
};

/* ---------------- Hero ---------------- */
const navItems = [
  { label: "Persona Studio", href: "/studio" },
  { label: "Business Center", href: "/studio?tab=command" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "The Tech", href: "#the-tech" },
  { label: "Inquiries", href: "#inquiries" },
];

export const PrismaHero = () => {
  return (
    <section className="relative w-full h-[100dvh] min-h-[600px] flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 bg-black">
      <div className="relative h-full w-full max-w-[1800px] mx-auto overflow-hidden rounded-2xl md:rounded-[2.25rem] shadow-2xl border border-white/10 bg-black">
        
        {/* Background video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          disablePictureInPicture
          className="absolute inset-0 h-full w-full object-cover select-none"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4"
        />

        {/* Subtle cinematic grain */}
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-60 mix-blend-overlay" />

        {/* Vignettes for visual contrast */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-transparent h-48" />

        {/* Responsive Navbar */}
        <nav className="absolute left-1/2 top-0 z-20 -translate-x-1/2 w-full max-w-fit px-4">
          <div className="flex items-center justify-between md:justify-center gap-4 rounded-b-2xl bg-black/80 backdrop-blur-md px-6 py-3 border border-white/10 md:rounded-b-3xl mt-0 shadow-2xl">
            
            <div className="hidden md:flex items-center gap-6 lg:gap-10">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-xs transition-colors md:text-sm font-medium"
                  style={{ color: "rgba(225, 224, 204, 0.7)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(225, 224, 204, 0.7)")}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <Link href="/login" className="flex md:hidden items-center justify-between w-full min-w-[200px]">
              <span className="text-white/90 text-sm font-medium tracking-wide">PersonaGrid</span>
              <Menu className="text-white/80 w-5 h-5 cursor-pointer" />
            </Link>
          </div>
        </nav>

        {/* Hero Bottom Content */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-6 sm:px-8 sm:pb-8 md:px-12 md:pb-10 lg:px-16 lg:pb-12 xl:px-20 xl:pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-end gap-6 sm:gap-8 lg:gap-12">
            
            {/* Monumental Headline */}
            <div className="lg:col-span-8 xl:col-span-8">
              <h1
                className="font-medium leading-[0.82] tracking-[-0.07em] text-[clamp(4.2rem,13vw,14rem)] 2xl:text-[15.5rem] select-none text-[#E1E0CC] drop-shadow-[0_4px_32px_rgba(0,0,0,0.8)]"
              >
                <WordsPullUp text="PersonaGrid" showAsterisk />
              </h1>
            </div>

            {/* Primary CTA Button */}
            <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-5 sm:gap-6 pb-2 lg:pb-4 max-w-lg lg:items-end">
              <Link href="/login" className="self-start lg:self-end">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="group inline-flex items-center gap-3 self-start rounded-full bg-[#E1E0CC] py-1.5 pl-6 pr-2 text-sm sm:text-base font-semibold text-black transition-all duration-300 hover:bg-white hover:gap-4 hover:shadow-[0_0_30px_rgba(225,224,204,0.4)] active:scale-95 cursor-pointer shadow-lg"
                >
                  <span>Join the grid</span>
                  <span className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-black transition-all duration-300 group-hover:scale-105">
                    <ArrowRight className="h-4 w-4 sm:h-4.5 sm:w-4.5 transition-transform duration-300 group-hover:translate-x-0.5 text-[#E1E0CC]" />
                  </span>
                </motion.div>
              </Link>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export { PrismaHero as PersonaGridHero };
export default PrismaHero;
