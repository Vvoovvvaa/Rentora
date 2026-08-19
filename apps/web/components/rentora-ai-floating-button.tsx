"use client";

import {
  Sparkles,
} from "lucide-react";

import {
  usePathname,
} from "next/navigation";

import { useI18n } from "@/context/i18n-context";
import { useRentoraAi } from "@/context/rentora-ai-context";
import { getRentoraAiCopy } from "@/lib/rentora-ai-copy";

const HIDDEN_PATHS = [
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/account-blocked",
];

export function RentoraAiFloatingButton() {
  const pathname =
    usePathname();

  const { locale } =
    useI18n();

  const {
    isOpen,
    openPanel,
  } = useRentoraAi();

  const copy =
    getRentoraAiCopy(locale);

  const hidden =
    HIDDEN_PATHS.some(
      (path) =>
        pathname === path ||
        pathname.startsWith(
          `${path}/`,
        ),
    );

  if (
    hidden ||
    isOpen
  ) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={openPanel}
      aria-label={copy.askAi}
      className="group fixed bottom-5 right-4 z-50 flex h-14 items-center gap-2 rounded-full border border-[#e6c99f]/40 bg-[#3e3026] px-4 text-[#f5d8ae] shadow-[0_16px_45px_rgba(39,27,19,.28)] transition duration-300 hover:-translate-y-1 hover:bg-[#4c392b] hover:shadow-[0_20px_55px_rgba(39,27,19,.36)] sm:bottom-6 sm:right-6 sm:px-5"
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f0d0a2]/12 transition group-hover:bg-[#f0d0a2]/20">
        <Sparkles
          size={16}
        />
      </span>

      <span className="hidden text-xs font-black tracking-[-.01em] sm:inline">
        {copy.askAi}
      </span>
    </button>
  );
}