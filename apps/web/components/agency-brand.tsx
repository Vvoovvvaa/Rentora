"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2, CheckCircle2 } from "lucide-react";

import type { Agency } from "@/types/models";
import { useI18n } from "@/context/i18n-context";

import styles from "./agency-pages.module.css";

export function AgencyLogo({
  agency,
  size = "normal",
}: {
  agency?: Agency | null;
  size?: "small" | "normal" | "large";
}) {
  const dimension = size === "large" ? 84 : size === "small" ? 30 : 44;
  const imageUrl = agency?.image?.url;

  return (
    <div
      className={`${styles.logo} ${
        size === "large" ? styles.logoLarge : size === "small" ? styles.logoSmall : ""
      }`}
      aria-label={agency?.name ? `${agency.name} logo` : undefined}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={agency?.name ? `${agency.name} logo` : ""}
          width={dimension}
          height={dimension}
          sizes={`${dimension}px`}
          unoptimized
        />
      ) : (
        <Building2 size={size === "large" ? 30 : size === "small" ? 14 : 20} aria-hidden="true" />
      )}
    </div>
  );
}

export function AgencyVerified({ verified }: { verified: boolean }) {
  const { t } = useI18n();

  return verified ? (
    <span className={styles.verified}>
      <CheckCircle2 size={14} />
      {t("agency.verified")}
    </span>
  ) : null;
}

export function AgencyCompact({ agency }: { agency: Agency }) {
  const { t } = useI18n();

  return (
    <Link href={`/agency/${agency.id}`} className={styles.compact}>
      <AgencyBadge agency={agency} />
      <small>{t("agency.listedBy")}</small>
    </Link>
  );
}

export function AgencyBadge({ agency }: { agency: Agency }) {
  return (
    <>
      <AgencyLogo agency={agency} size="small" />
      <span>{agency.name}</span>
      <AgencyVerified verified={agency.verified} />
    </>
  );
}
