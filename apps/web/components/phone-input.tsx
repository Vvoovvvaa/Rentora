"use client";

function formatArmenianPhone(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^374/, "").slice(0, 8);
  const groups = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 8)].filter(Boolean);
  return `+374 ${groups.join(" ")}`.trim();
}

export function PhoneInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="block text-sm font-semibold text-slate-700"><span className="mb-2 block">Phone</span><input value={formatArmenianPhone(value || "+374")} onChange={(event) => onChange(formatArmenianPhone(event.target.value))} className="field" inputMode="tel" autoComplete="tel" placeholder="+374 91 123 456" aria-label="Armenian phone number"/><p className="mt-2 text-xs font-medium text-slate-400">Armenian mobile number, e.g. +374 91 123 456</p></label>;
}
