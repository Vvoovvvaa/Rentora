"use client";

import {
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import type {
  FormEvent,
} from "react";

import { useI18n } from "@/context/i18n-context";
import { useRentoraAi } from "@/context/rentora-ai-context";
import { getRentoraAiCopy } from "@/lib/rentora-ai-copy";

export function RentoraAiHeroSearch() {
  const { locale } = useI18n();

  const {
    draft,
    setDraft,
    sendMessage,
    openPanel,
    loading,
  } = useRentoraAi();

  const copy =
    getRentoraAiCopy(locale);

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    await sendMessage(draft);
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg border border-[#dcb984]/30 bg-[#dcb984]/10 text-[#efcf9f]">
            <Sparkles size={14} />
          </span>

          <span className="text-[11px] font-black uppercase tracking-[.18em] text-[#efd5ae]">
            {copy.heroLabel}
          </span>

          <span className="hidden text-xs font-medium text-stone-400 sm:inline">
            {copy.heroHint}
          </span>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="group relative"
      >
        <div className="relative flex items-center rounded-[22px] border border-[#e0bc87]/25 bg-white/[.075] p-1.5 shadow-[0_20px_55px_rgba(0,0,0,.18)] backdrop-blur-xl transition duration-300 focus-within:border-[#e4c08b]/55 focus-within:bg-white/[.1] focus-within:shadow-[0_24px_65px_rgba(0,0,0,.28)] hover:border-[#e0bc87]/40">
          <div className="ml-3 grid h-10 w-10 flex-none place-items-center rounded-[14px] bg-[#e4c08b]/10 text-[#eac99a]">
            <Sparkles size={18} />
          </div>

          <input
            type="text"
            value={draft}
            maxLength={500}
            disabled={loading}
            placeholder={
              copy.heroPlaceholder
            }
            aria-label={
              copy.heroPlaceholder
            }
            onFocus={openPanel}
            onClick={openPanel}
            onChange={(event) =>
              setDraft(
                event.target.value,
              )
            }
            className="min-w-0 flex-1 bg-transparent px-4 py-4 text-[15px] font-medium text-white outline-none placeholder:text-stone-400 disabled:opacity-60 sm:text-base"
          />

          <button
            type="submit"
            disabled={
              loading ||
              !draft.trim()
            }
            aria-label={copy.send}
            className="grid h-12 w-12 flex-none place-items-center rounded-[16px] bg-[#f1d3a7] text-[#38291f] shadow-[0_8px_20px_rgba(231,194,141,.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#f7dfbd] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          >
            <ArrowUpRight
              size={19}
              strokeWidth={2.4}
            />
          </button>
        </div>
      </form>

      <p className="mt-2.5 pl-1 text-[11px] font-medium leading-5 text-stone-400 sm:text-xs">
        {copy.heroExample}
      </p>
    </div>
  );
}