"use client";

import Link from "next/link";
import { Home, ShieldAlert, UserRound } from "lucide-react";
import { useI18n } from "@/context/i18n-context";

export function AccountBlockedPage() {
  const { t } = useI18n();

  return <main className="min-h-[calc(100vh-176px)] bg-[radial-gradient(circle_at_18%_12%,rgba(212,175,130,.22),transparent_29%),linear-gradient(180deg,#f9f5ef_0%,#f3ece3_100%)] px-5 py-16 sm:py-24">
    <section className="mx-auto max-w-xl rounded-[30px] border border-[#e2d4c3] bg-[#fffdf9]/95 p-8 text-center shadow-[0_22px_55px_rgba(57,38,23,.12)] sm:p-12">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#f2e4d2] text-[#765137]"><ShieldAlert size={27}/></span>
      <p className="eyebrow mt-6">{t("errors.accountStatus")}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] text-[#35271f] sm:text-4xl">{t("errors.accountBlockedTitle")}</h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[#78695d] sm:text-base">{t("errors.accountBlockedCopy")}</p>
      <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#8c7969]">{t("errors.accountBlockedSupportUnavailable")}</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link href="/login" className="btn-primary inline-flex min-h-12 items-center justify-center gap-2"><UserRound size={17}/>{t("errors.anotherAccount")}</Link>
        <Link href="/" className="btn-secondary inline-flex min-h-12 items-center justify-center gap-2"><Home size={17}/>{t("errors.backHome")}</Link>
      </div>
    </section>
  </main>;
}
