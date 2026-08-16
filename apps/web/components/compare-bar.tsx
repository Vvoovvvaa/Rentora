"use client";

import Link from "next/link";
import { GitCompare, ImageOff, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCompare } from "@/context/compare-context";
import { propertiesApi } from "@/lib/api";
import type { Property } from "@/types/models";
import { priceOf } from "./property-presentation";
import { useI18n } from "@/context/i18n-context";

export function CompareBar() {
  const { selectedIds, remove, clear, message } = useCompare();
  const { t } = useI18n();
  const [homes, setHomes] = useState<Record<number, Property>>({});

  useEffect(() => {
    let active = true;
    if (!selectedIds.length) return () => { active = false; };
    void Promise.all(selectedIds.map((id) => propertiesApi.one(id).catch(() => null))).then((items) => {
      if (!active) return;
      setHomes(Object.fromEntries(items.filter((item): item is Property => Boolean(item)).map((item) => [item.id, item])));
    });
    return () => { active = false; };
  }, [selectedIds]);

  if (!selectedIds.length) return null;
  const ready = selectedIds.length === 2;
  const href = ready ? `/compare?first=${selectedIds[0]}&second=${selectedIds[1]}` : "#";

  return <aside className="compare-bar" aria-live="polite">
    <div className="compare-bar-inner">
      <div className="compare-bar-heading"><GitCompare size={18}/><span>{t("compare.compareProperties")}</span><small>{t("compare.selected", { count: selectedIds.length })}</small></div>
      <div className="compare-selection-list">
        {selectedIds.map((id) => {
          const home = homes[id];
          const image = home?.images?.[0]?.url;
          return <div className="compare-selection" key={id}>
            {image ? <img src={image} alt=""/> : <span className="compare-selection-placeholder"><ImageOff size={14}/></span>}
            <div className="min-w-0"><strong>{home?.title || t("compare.oneSelected")}</strong>{home && <small>{priceOf(home)}</small>}</div>
            <button type="button" onClick={() => remove(id)} aria-label={t("compare.remove")}><X size={14}/></button>
          </div>;
        })}
        {selectedIds.length === 1 && <span className="compare-empty-slot">{t("compare.chooseAnother")}</span>}
      </div>
      <div className="compare-bar-actions"><button type="button" onClick={clear} className="compare-clear">{t("common.clear")}</button><Link href={href} tabIndex={ready ? undefined : -1} onClick={(event) => { if (!ready) event.preventDefault(); }} aria-disabled={!ready} className={`btn-primary compare-action ${ready ? "" : "is-disabled"}`}>{t("property.compare")}</Link></div>
    </div>
    {message && <p className="compare-bar-message">{message}</p>}
  </aside>;
}
