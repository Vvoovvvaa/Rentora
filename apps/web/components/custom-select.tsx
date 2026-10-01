"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };

type CustomSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  className?: string;
  ariaLabel?: string;
  allowEmpty?: boolean;
};

export function CustomSelect({ value, onChange, options, placeholder, className = "", ariaLabel, allowEmpty = true }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = options.find((option) => option.value === value);

  const focusOption = (direction: "first" | "last" | "next" | "previous") => {
    const items = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>(".custom-select-option") || []);
    if (!items.length) return;
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const index = direction === "first" ? 0 : direction === "last" ? items.length - 1 : direction === "next" ? Math.min(items.length - 1, current < 0 ? 0 : current + 1) : Math.max(0, current < 0 ? items.length - 1 : current - 1);
    items[index]?.focus();
  };

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return <div ref={rootRef} className={`custom-select ${className}`}>
    <button ref={triggerRef} type="button" className={`custom-select-trigger ${open ? "is-open" : ""}`} onClick={() => setOpen((current) => !current)} onKeyDown={(event) => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); window.setTimeout(() => focusOption(event.key === "ArrowDown" ? "first" : "last"), 0); } }} aria-label={ariaLabel || placeholder} aria-expanded={open} aria-haspopup="listbox">
      <span>{selected?.label || placeholder}</span>
      <ChevronDown size={17} aria-hidden="true" className={open ? "rotate-180" : ""}/>
    </button>
    {open && <div className="custom-select-menu" role="listbox" aria-label={ariaLabel || placeholder} onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); setOpen(false); triggerRef.current?.focus(); } else if (event.key === "ArrowDown") { event.preventDefault(); focusOption("next"); } else if (event.key === "ArrowUp") { event.preventDefault(); focusOption("previous"); } else if (event.key === "Home") { event.preventDefault(); focusOption("first"); } else if (event.key === "End") { event.preventDefault(); focusOption("last"); } }}>
      {allowEmpty && <button type="button" role="option" aria-selected={!value} className={`custom-select-option ${!value ? "is-selected" : ""}`} onClick={() => { onChange(""); setOpen(false); }}>
        <span>{placeholder}</span>{!value && <Check size={15}/>} 
      </button>}
      {options.map((option) => <button type="button" role="option" aria-selected={value === option.value} className={`custom-select-option ${value === option.value ? "is-selected" : ""}`} key={option.value} onClick={() => { onChange(option.value); setOpen(false); }}>
        <span>{option.label}</span>{value === option.value && <Check size={15}/>} 
      </button>)}
    </div>}
  </div>;
}
