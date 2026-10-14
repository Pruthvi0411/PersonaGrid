"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export type RoleType = "creator" | "business";

interface RadioProps {
  value?: RoleType;
  onChange?: (val: RoleType) => void;
  className?: string;
}

export const Radio = ({ value, onChange, className }: RadioProps) => {
  const [internalValue, setInternalValue] = useState<RoleType>("creator");
  const activeRole = value !== undefined ? value : internalValue;

  const handleSelect = (role: RoleType) => {
    if (value === undefined) {
      setInternalValue(role);
    }
    onChange?.(role);
  };

  const isCreator = activeRole === "creator";

  return (
    <div
      role="radiogroup"
      aria-label="Account role selector"
      className={cn(
        "relative flex items-center p-1 rounded-2xl overflow-hidden select-none",
        "bg-white/[0.06] backdrop-blur-xl border border-white/10",
        "shadow-[inset_1px_1px_4px_rgba(255,255,255,0.18),inset_-1px_-1px_6px_rgba(0,0,0,0.4),0_8px_24px_rgba(0,0,0,0.35)]",
        className
      )}
    >
      {/* Glider Slider */}
      <div
        className={cn(
          "absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-xl z-[1] transition-all duration-500 ease-[cubic-bezier(0.37,1.95,0.66,0.56)] pointer-events-none",
          isCreator
            ? "translate-x-0 bg-gradient-to-br from-neutral-300 via-neutral-100 to-white shadow-[0_0_20px_rgba(192,192,192,0.6),inset_0_0_10px_rgba(255,255,255,0.8)]"
            : "translate-x-full bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-200 shadow-[0_0_20px_rgba(255,215,0,0.6),inset_0_0_10px_rgba(255,235,150,0.8)]"
        )}
      />

      {/* Option 1: Persona Creator (Silver) */}
      <label
        htmlFor="glass-silver"
        onClick={() => handleSelect("creator")}
        className={cn(
          "relative z-[2] flex-1 flex items-center justify-center min-w-[135px] sm:min-w-[150px] py-2.5 px-4 text-xs sm:text-sm font-semibold tracking-wide rounded-xl cursor-pointer transition-colors duration-300",
          isCreator ? "text-neutral-950 font-bold" : "text-neutral-400 hover:text-white"
        )}
      >
        <input
          type="radio"
          name="role-plan"
          id="glass-silver"
          value="creator"
          checked={isCreator}
          onChange={() => handleSelect("creator")}
          className="sr-only"
        />
        <span>Persona Creator</span>
      </label>

      {/* Option 2: Business Center (Gold) */}
      <label
        htmlFor="glass-gold"
        onClick={() => handleSelect("business")}
        className={cn(
          "relative z-[2] flex-1 flex items-center justify-center min-w-[135px] sm:min-w-[150px] py-2.5 px-4 text-xs sm:text-sm font-semibold tracking-wide rounded-xl cursor-pointer transition-colors duration-300",
          !isCreator ? "text-neutral-950 font-bold" : "text-neutral-400 hover:text-white"
        )}
      >
        <input
          type="radio"
          name="role-plan"
          id="glass-gold"
          value="business"
          checked={!isCreator}
          onChange={() => handleSelect("business")}
          className="sr-only"
        />
        <span>Business Center</span>
      </label>
    </div>
  );
};

export default Radio;
