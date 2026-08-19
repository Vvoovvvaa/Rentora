"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BedDouble,
  MapPin,
  Maximize2,
} from "lucide-react";

import type {
  AiPropertyResult,
} from "@/types/models";

import {
  cityOf,
  formatMoney,
} from "./property-presentation";

import { useI18n } from "@/context/i18n-context";
import { getRentoraAiCopy } from "@/lib/rentora-ai-copy";

export function RentoraAiPropertyCard({
  property,
}: {
  property: AiPropertyResult;
}) {
  const { locale } = useI18n();

  const copy =
    getRentoraAiCopy(locale);

  const parsedPrice =
    Number(property.price);

  const formattedPrice =
    Number.isFinite(parsedPrice)
      ? formatMoney(
          parsedPrice,
          property.currency,
        )
      : String(property.price);

  return (
    <Link
      href={`/properties/${property.id}`}
      className="group flex overflow-hidden rounded-[18px] border border-[#eadfd2] bg-[#fffdfa] shadow-[0_6px_20px_rgba(61,43,29,.07)] transition duration-200 hover:-translate-y-0.5 hover:border-[#d5b48c] hover:shadow-[0_12px_30px_rgba(61,43,29,.12)]"
    >
      <div className="h-[112px] w-[112px] flex-none overflow-hidden bg-[#49382b]">
        {property.image ? (
          <img
            src={property.image}
            alt={property.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_70%_20%,#d7b483,transparent_30%),linear-gradient(145deg,#74563e,#2b211b)]" />
        )}
      </div>

      <div className="min-w-0 flex-1 p-3.5">
        <h4 className="line-clamp-2 text-[13px] font-extrabold leading-[1.35] tracking-[-.025em] text-[#30251e]">
          {property.title}
        </h4>

        <p className="mt-1.5 text-[16px] font-black tracking-[-.04em] text-[#765235]">
          {formattedPrice}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-stone-500">
          <span className="flex items-center gap-1">
            <BedDouble
              size={12}
            />
            {property.rooms}
          </span>

          <span className="flex items-center gap-1">
            <Maximize2
              size={12}
            />
            {property.area} m²
          </span>

          <span className="flex min-w-0 items-center gap-1">
            <MapPin
              size={12}
            />

            <span className="truncate">
              {cityOf(
                property.city,
              )}
            </span>
          </span>
        </div>

        <span className="mt-2 flex items-center gap-1 text-[10px] font-extrabold text-[#9a704a]">
          {copy.viewProperty}

          <ArrowUpRight
            size={11}
          />
        </span>
      </div>
    </Link>
  );
}