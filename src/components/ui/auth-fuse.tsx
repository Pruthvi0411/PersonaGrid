"use client";

import * as React from "react";
import { useState, useId, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff, ArrowLeft, ShieldCheck, Sparkles, Building2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Radio, { type RoleType } from "./glass-radio-group";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ---------------- Typewriter Effect Component ---------------- */
interface TypewriterProps {
  text: string[];
  speed?: number;
  pause?: number;
  className?: string;
}

export function Typewriter({
  text,
  speed = 50,
  pause = 2000,
  className,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState("");
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (text.length === 0) return;

    if (subIndex === text[index].length + 1 && !isDeleting) {
      const timeout = setTimeout(() => setIsDeleting(true), pause);
      return () => clearTimeout(timeout);
    }

    if (subIndex === 0 && isDeleting) {
      setIsDeleting(false);
      setIndex((prev) => (prev + 1) % text.length);
      return;
    }

    const timeout = setTimeout(
      () => {
        setSubIndex((prev) => prev + (isDeleting ? -1 : 1));
      },
      isDeleting ? speed / 2 : speed
    );

    return () => clearTimeout(timeout);
  }, [subIndex, index, isDeleting, text, speed, pause]);

  useEffect(() => {
    if (text[index]) {
      setDisplayText(text[index].substring(0, subIndex));
    }
  }, [subIndex, index, text]);

  return (
    <span className={cn("inline-block font-mono", className)}>
      {displayText}
      <span className="inline-block w-[2px] h-[1em] ml-1 bg-[#E1E0CC] animate-pulse align-middle" />
    </span>
  );
}

/* ---------------- Label Component ---------------- */
const labelVariants = cva(
  "text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[#E1E0CC]/80"
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

/* ---------------- Button Component ---------------- */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#E1E0CC] text-black shadow-lg hover:bg-white hover:shadow-[0_0_24px_rgba(225,224,204,0.35)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-white/15 bg-white/[0.04] backdrop-blur-sm text-[#E1E0CC] hover:bg-white/[0.1] hover:border-white/30 hover:text-white shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-white/10 hover:text-white text-[#E1E0CC]/80",
        link: "text-[#E1E0CC] underline-offset-4 hover:underline p-0 h-auto font-medium",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

/* ---------------- Input Component ---------------- */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-white/15 bg-black/60 px-3.5 py-2 text-sm text-[#E1E0CC] shadow-inner transition-colors",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500",
          "focus-visible:outline-none focus-visible:border-white/40 focus-visible:ring-1 focus-visible:ring-white/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

/* ---------------- PasswordInput Component ---------------- */
interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label = "Password", id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={inputId}>{label}</Label>
          <a
            href="#"
            className="text-xs text-[#E1E0CC]/60 hover:text-[#E1E0CC] transition-colors underline-offset-4 hover:underline"
          >
            Forgot password?
          </a>
        </div>
        <div className="relative">
          <Input
            id={inputId}
            type={showPassword ? "text" : "password"}
            className={cn("pr-10", className)}
            ref={ref}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#E1E0CC] transition-colors p-1"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

/* ---------------- SignInForm ---------------- */
function SignInForm({ role }: { role: RoleType }) {
  const router = useRouter();
  const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log(`UI: Sign In form submitted for role: ${role}`);
    router.push(role === 'business' ? '/studio?tab=command' : '/studio');
  };

  const isCreator = role === "creator";

  return (
    <form onSubmit={handleSignIn} autoComplete="on" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border border-white/10 bg-white/[0.04]">
          {isCreator ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-neutral-300" />
              <span className="text-neutral-300">Persona Creator Access</span>
            </>
          ) : (
            <>
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400">Business Center Portal</span>
            </>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#E1E0CC]">
          Sign in to your account
        </h1>
        <p className="text-xs sm:text-sm text-[#E1E0CC]/60 max-w-xs">
          {isCreator
            ? "Enter your credentials to monetize your synthetic preferences."
            : "Enter enterprise credentials to query sovereign consumer cohorts."}
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="signin-email">Email</Label>
          <Input
            autoComplete="email"
            id="signin-email"
            name="email"
            placeholder={isCreator ? "creator@personagrid.io" : "enterprise@firm.com"}
            required
            type="email"
          />
        </div>
        <PasswordInput
          autoComplete="current-password"
          id="signin-password"
          label="Password"
          name="password"
          placeholder="••••••••••••"
          required
        />
        <Button
          className={cn(
            "mt-2 w-full",
            !isCreator && "bg-gradient-to-r from-amber-400 to-yellow-300 text-black hover:from-amber-300 hover:to-yellow-200"
          )}
          type="submit"
        >
          Sign In
        </Button>
      </div>
    </form>
  );
}

/* ---------------- SignUpForm ---------------- */
function SignUpForm({ role }: { role: RoleType }) {
  const router = useRouter();
  const handleSignUp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log(`UI: Sign Up form submitted for role: ${role}`);
    router.push(role === 'business' ? '/studio?tab=command' : '/studio');
  };

  const isCreator = role === "creator";

  return (
    <form onSubmit={handleSignUp} autoComplete="on" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border border-white/10 bg-white/[0.04]">
          {isCreator ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-neutral-300" />
              <span className="text-neutral-300">Join as Persona Creator</span>
            </>
          ) : (
            <>
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400">Register Enterprise Account</span>
            </>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#E1E0CC]">
          Create an account
        </h1>
        <p className="text-xs sm:text-sm text-[#E1E0CC]/60 max-w-xs">
          {isCreator
            ? "Mint your zero-PII synthetic persona and begin leasing."
            : "Deploy telemetry cohorts with sub-second vector search."}
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="signup-name">
            {isCreator ? "Full Name or Pseudonym" : "Company / Organization Name"}
          </Label>
          <Input
            autoComplete="name"
            id="signup-name"
            name="name"
            placeholder={isCreator ? "Alex Vance" : "Apex Intelligence Ltd"}
            required
            type="text"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="signup-email">Work Email</Label>
          <Input
            autoComplete="email"
            id="signup-email"
            name="email"
            placeholder={isCreator ? "alex@personagrid.io" : "contact@apex.com"}
            required
            type="email"
          />
        </div>
        <PasswordInput
          autoComplete="new-password"
          id="signup-password"
          label="Password"
          name="password"
          placeholder="••••••••••••"
          required
        />
        <Button
          className={cn(
            "mt-2 w-full",
            !isCreator && "bg-gradient-to-r from-amber-400 to-yellow-300 text-black hover:from-amber-300 hover:to-yellow-200"
          )}
          type="submit"
        >
          Create Account
        </Button>
      </div>
    </form>
  );
}

/* ---------------- AuthFormContainer ---------------- */
function AuthFormContainer({
  isSignIn,
  onToggle,
}: {
  isSignIn: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const [role, setRole] = useState<RoleType>("creator");

  return (
    <div className="mx-auto flex flex-col w-full max-w-[380px] gap-6">
      {/* Centered Glass Radio Toggle */}
      <div className="flex justify-center w-full mb-1">
        <Radio value={role} onChange={setRole} />
      </div>

      {/* Forms */}
      {isSignIn ? <SignInForm role={role} /> : <SignUpForm role={role} />}

      {/* Toggle between Sign In / Sign Up */}
      <div className="text-center text-xs sm:text-sm text-[#E1E0CC]/70">
        {isSignIn ? "Don't have an account?" : "Already have an account?"}{" "}
        <Button className="pl-1 text-[#E1E0CC] font-semibold" onClick={onToggle} variant="link">
          {isSignIn ? "Sign up" : "Sign in"}
        </Button>
      </div>

      {/* Divider */}
      <div className="relative text-center text-xs after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-white/10">
        <span className="relative z-10 bg-black px-3 text-[#E1E0CC]/50 uppercase tracking-widest text-[10px]">
          Or continue with
        </span>
      </div>

      {/* Google OAuth Button */}
      <Button
        onClick={() => {
          console.log("UI: Google button clicked");
          router.push("/studio");
        }}
        type="button"
        variant="outline"
        className="w-full gap-2.5 h-11"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
          <path d="M1 1h22v22H1z" fill="none" />
        </svg>
        <span>Continue with Google</span>
      </Button>
    </div>
  );
}

/* ---------------- Main AuthUI Component (Split Screen) ---------------- */
export interface AuthUIProps {
  initialIsSignIn?: boolean;
}

export function AuthUI({ initialIsSignIn = true }: AuthUIProps) {
  const [isSignIn, setIsSignIn] = useState(initialIsSignIn);

  const quotePhrases = [
    "Zero PII exposure. Total identity sovereignty.",
    "Decentralized synthetic preferences leased on-demand.",
    "Hardware-proximal telemetry for autonomous research.",
    "Monetize consumer vectors with mathematical stealth.",
  ];

  return (
    <div className="relative min-h-screen w-full bg-black text-[#E1E0CC] flex flex-col lg:grid lg:grid-cols-12 overflow-hidden selection:bg-[#E1E0CC] selection:text-black">
      
      {/* Left Column: Auth Interface */}
      <div className="relative z-10 flex flex-col justify-between p-6 sm:p-10 lg:p-14 lg:col-span-6 xl:col-span-5 min-h-screen bg-black/95">
        
        {/* Top Header: Logo & Return Link */}
        <div className="flex items-center justify-between w-full">
          <Link
            href="/"
            className="group flex items-center gap-2 text-sm font-semibold tracking-tight text-[#E1E0CC] hover:text-white transition-colors"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 border border-white/20 group-hover:border-white/40 transition-colors">
              P
            </span>
            <span className="text-base tracking-wider uppercase font-bold">PersonaGrid</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#E1E0CC]/60 hover:text-[#E1E0CC] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to site</span>
          </Link>
        </div>

        {/* Center: Form Container */}
        <div className="my-auto py-8">
          <AuthFormContainer
            isSignIn={isSignIn}
            onToggle={() => setIsSignIn(!isSignIn)}
          />
        </div>

        {/* Bottom Security / Privacy Badge */}
        <div className="flex items-center justify-between text-[11px] text-[#E1E0CC]/40 pt-4 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80" />
            <span>End-to-end homomorphic vector encryption</span>
          </div>
          <span>© 2026 PersonaGrid Inc.</span>
        </div>
      </div>

      {/* Right Column: Cybernetic Artwork & Typewriter Overlay (Split Screen) */}
      <div className="relative hidden lg:block lg:col-span-6 xl:col-span-7 min-h-screen overflow-hidden bg-neutral-950">
        
        {/* Background Artwork */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2160&q=85')`,
          }}
        />

        {/* Cinematic Vignette Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="noise-overlay absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none" />

        {/* Corner HUD Accent */}
        <div className="absolute top-10 right-10 flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-black/60 backdrop-blur-md text-[11px] font-mono tracking-widest text-[#E1E0CC]/75 uppercase">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Grid Status: Sovereign</span>
        </div>

        {/* Bottom Cybernetic Quote & Typewriter Overlay */}
        <div className="absolute bottom-12 left-12 right-12 z-20 max-w-xl">
          <div className="p-8 rounded-3xl bg-black/75 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-1.5 w-8 rounded-full bg-[#E1E0CC]" />
              <span className="text-[11px] font-mono tracking-widest text-[#E1E0CC]/70 uppercase">
                Architecture Philosophy // AGY-V4
              </span>
            </div>

            <p className="text-xl xl:text-2xl font-medium tracking-tight text-[#E1E0CC] min-h-[3.5rem] leading-snug">
              &ldquo;<Typewriter text={quotePhrases} speed={40} pause={2500} />&rdquo;
            </p>

            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#E1E0CC]/60">
              <span className="font-semibold text-[#E1E0CC]/90">Synthetic Identity Engine</span>
              <span className="font-mono text-[11px]">LATENCY &lt; 8ms</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

export default AuthUI;
